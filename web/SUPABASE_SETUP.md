# Scheduled Payments Configuration with Supabase

This document explains how to configure the scheduled payments functionality in Galaxy Smart Wallet using Supabase as backend.

## 📋 Prerequisites

1. Supabase account
2. Configured Supabase project
3. Node.js and npm installed

## 🚀 Initial Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ENCRYPTION_KEY=your_secure_encryption_key
ENCRYPTION_KEY=your_secure_encryption_key_for_edge_functions
STELLAR_NETWORK=testnet
```

### 3. Create Table in Supabase

Execute the following SQL in Supabase SQL editor:

```sql
-- See file: supabase/migrations/001_create_scheduled_payments.sql
```

### 4. Configure Authentication (Optional)

If you plan to use Supabase authentication, configure appropriate RLS policies.

## 🏗️ Architecture

### Main Components

1. **SupabaseAutomationForm**: Form to create scheduled payments
2. **ScheduledPaymentsList**: List of user's scheduled payments
3. **ScheduledPaymentsService**: Service to interact with Supabase
4. **useScheduledPayments**: React hook to manage state

### Data Flow

1. User creates a scheduled payment in the form
2. Secret key is encrypted before storing
3. Data is saved in Supabase
4. An Edge Function executes payments when the time comes
5. Status is updated in the database

## 🔒 Security

### Key Encryption

Secret keys are encrypted using AES before storage:

```typescript
const encryptedSecret = CryptoJS.AES.encrypt(secretKey, ENCRYPTION_KEY).toString()
```

### Row Level Security (RLS)

RLS policies ensure users can only access their own payments:

```sql
CREATE POLICY "Users can view own scheduled payments" ON scheduled_payments
    FOR SELECT USING (auth.uid() = user_id);
```

## ⚡ Edge Function for Execution

### Configuration

1. Install Supabase CLI
2. Deploy the Edge Function:

```bash
supabase functions deploy execute-scheduled-payments
```

### Automatic Scheduling

Configure a cron job to execute the function periodically:

```bash
# Execute every 5 minutes
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/execute-scheduled-payments
```

### Environment Variables for Edge Function

The Edge Function requires these environment variables in Supabase:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_encryption_key
STELLAR_NETWORK=testnet
```

## 📊 Monitoring

### Transaction Logs

All transactions are logged with:
- Transaction hash
- Status (executed/error)
- Execution timestamp
- Error messages (if any)

### Error Handling

Errors are captured and stored in the database for debugging:
- Failed transactions are marked with 'error' status
- Error messages are stored in `last_error` field
- Retry logic can be implemented based on error types

## 🔄 Recurring Payments

### Supported Frequencies

- `once`: One time only
- `weekly`: Weekly
- `monthly`: Monthly
- `yearly`: Yearly

### Recurrence Logic

When a recurring payment is executed successfully, the next payment in the sequence is automatically created with the calculated next execution date.

## 🧪 Testing

### Test Environment

Use Stellar's testnet for testing:

```typescript
const server = new Server('https://horizon-testnet.stellar.org')
```

### Test Data

Create test payments with small amounts to verify functionality:
- Use testnet XLM for testing
- Test all frequency types
- Verify error handling with invalid data

## 📈 Scalability

### Optimizations

1. Database indexes for fast queries
2. Pagination for large payment lists
3. Caching for frequent queries
4. Batch processing for multiple payments

### Limits

- Maximum 100 scheduled payments per user
- Minimum execution frequency: 1 minute
- Maximum memo length: 28 bytes (Stellar limit)

## 🚨 Production Considerations

1. **Backup**: Configure automatic Supabase backups
2. **Monitoring**: Implement alerts for execution failures
3. **Rate Limiting**: Configure API limits
4. **Encryption**: Use robust encryption keys
5. **Auditing**: Maintain logs of all operations
6. **Security**: 
   - Use environment variables for sensitive data
   - Implement proper RLS policies
   - Regular security audits
7. **Performance**:
   - Monitor Edge Function execution times
   - Optimize database queries
   - Implement proper error handling

## 🔧 Configuration Files

### deno.json (for Edge Function development)

```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "importMap": "./import_map.json"
}
```

### tsconfig.json (exclude Edge Functions)

```json
{
  "compilerOptions": {
    // ... other options
  },
  "exclude": [
    "supabase/functions/**/*"
  ]
}
```

## 🚀 Deployment

### Edge Function Deployment

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy the function:
```bash
supabase functions deploy execute-scheduled-payments
```

### Environment Setup

Set environment variables in Supabase dashboard:
- Go to Project Settings > Edge Functions
- Add required environment variables
- Test the function execution

## 📞 Support

For issues or questions:
1. Check Supabase logs
2. Verify environment variable configuration
3. Consult Stellar SDK documentation
4. Review Edge Function logs in Supabase dashboard
5. Test with small amounts on testnet first

## 🔄 Future Enhancements

1. **Envelope Encryption**: Implement envelope encryption for enhanced security
2. **Multi-signature Support**: Add support for multi-signature transactions
3. **Advanced Scheduling**: Support for more complex scheduling patterns
4. **Notification System**: Email/SMS notifications for payment execution
5. **Analytics Dashboard**: Payment analytics and reporting
6. **Backup Recovery**: Automated backup and recovery procedures