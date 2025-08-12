import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  Keypair, 
  Server, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  Asset,
  Memo 
} from 'https://esm.sh/stellar-sdk@12.1.0'
import { AES, enc } from 'https://esm.sh/crypto-js@4.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize Stellar server
    const stellarNetwork = Deno.env.get('STELLAR_NETWORK') || 'testnet'
    const horizonUrl = stellarNetwork === 'mainnet' 
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org'
    
    const server = new Server(horizonUrl)
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') ?? ''
    const networkPassphrase = stellarNetwork === 'mainnet' 
      ? Networks.PUBLIC 
      : Networks.TESTNET

    // Get current time
    const now = new Date().toISOString()

    // Fetch pending payments that are ready to execute
    const { data: payments, error: fetchError } = await supabaseClient
      .from('scheduled_payments')
      .select('*')
      .eq('status', 'pending')
      .lte('execute_at', now)

    if (fetchError) {
      throw new Error(`Error fetching payments: ${fetchError.message}`)
    }

    const results = []

    for (const payment of payments || []) {
      try {
        // Decrypt the secret key
        const decryptedSecret = AES.decrypt(payment.encrypted_secret, encryptionKey).toString(enc.Utf8)
        
        if (!decryptedSecret) {
          throw new Error('Failed to decrypt secret key')
        }

        const sourceKeypair = Keypair.fromSecret(decryptedSecret)

        // Load the source account
        const sourceAccount = await server.loadAccount(sourceKeypair.publicKey())

        // Determine the asset
        let asset
        if (payment.asset === 'XLM' || payment.asset === 'native') {
          asset = Asset.native()
        } else {
          // For other assets, parse the asset code and issuer
          // Expected format: "ASSET_CODE:ISSUER_PUBLIC_KEY"
          const [assetCode, issuerKey] = payment.asset.split(':')
          if (!assetCode || !issuerKey) {
            throw new Error(`Invalid asset format: ${payment.asset}. Expected format: ASSET_CODE:ISSUER_PUBLIC_KEY`)
          }
          asset = new Asset(assetCode, issuerKey)
        }

        // Build the transaction
        const transactionBuilder = new TransactionBuilder(sourceAccount, {
          fee: '100000', // 0.01 XLM
          networkPassphrase: networkPassphrase
        })

        // Add payment operation
        transactionBuilder.addOperation(Operation.payment({
          destination: payment.recipient,
          asset: asset,
          amount: payment.amount.toString()
        }))

        // Add memo if provided
        if (payment.memo && payment.memo.trim()) {
          // Truncate memo to 28 bytes for Stellar compatibility
          const truncatedMemo = payment.memo.length > 28 
            ? payment.memo.substring(0, 28) 
            : payment.memo
          transactionBuilder.addMemo(Memo.text(truncatedMemo))
        }

        // Set timeout and build
        const transaction = transactionBuilder.setTimeout(30).build()

        // Sign the transaction
        transaction.sign(sourceKeypair)

        // Submit the transaction
        const result = await server.submitTransaction(transaction)

        // Update payment status to executed with transaction details
        const { error: updateError } = await supabaseClient
          .from('scheduled_payments')
          .update({ 
            status: 'executed',
            executed_at: new Date().toISOString(),
            tx_hash: result.hash
          })
          .eq('id', payment.id)

        if (updateError) {
          console.error('Error updating payment status:', updateError)
        }

        results.push({
          paymentId: payment.id,
          status: 'success',
          transactionHash: result.hash,
          ledger: result.ledger
        })

        // If this is a recurring payment, create the next one
        if (payment.frequency !== 'once') {
          const nextExecuteAt = calculateNextExecution(payment.execute_at, payment.frequency)
          
          const { error: insertError } = await supabaseClient
            .from('scheduled_payments')
            .insert({
              user_id: payment.user_id,
              public_key: payment.public_key,
              encrypted_secret: payment.encrypted_secret,
              recipient: payment.recipient,
              asset: payment.asset,
              amount: payment.amount,
              memo: payment.memo,
              frequency: payment.frequency,
              execute_at: nextExecuteAt,
              status: 'pending'
            })

          if (insertError) {
            console.error('Error creating next recurring payment:', insertError)
          }
        }

      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error)
        
        // Update payment status to error with error details
        const { error: updateError } = await supabaseClient
          .from('scheduled_payments')
          .update({ 
            status: 'error',
            last_error: error.message
          })
          .eq('id', payment.id)

        if (updateError) {
          console.error('Error updating payment status to error:', updateError)
        }

        results.push({
          paymentId: payment.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedPayments: results.length,
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function execution error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function calculateNextExecution(currentExecution: string, frequency: string): string {
  const current = new Date(currentExecution)
  
  switch (frequency) {
    case 'weekly':
      current.setDate(current.getDate() + 7)
      break
    case 'monthly':
      current.setMonth(current.getMonth() + 1)
      break
    case 'yearly':
      current.setFullYear(current.getFullYear() + 1)
      break
    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }
  
  return current.toISOString()
}