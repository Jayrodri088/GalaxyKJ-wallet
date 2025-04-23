const { Server, Asset } = require('stellar-sdk');

const server = new Server('https://horizon-testnet.stellar.org'); // Cambia a mainnet si deseas

// Lista de tokens populares en Stellar testnet (puedes reemplazar con mainnet si es real)
const assets = [
  {
    code: 'USDC',
    issuer: 'GDRXE2BQUC3AZFKY3D5S3GOUEF4WUJXRI4OYTR5Q6XQHLWTCUGXV3KDD'
  },
  {
    code: 'ETH',
    issuer: 'GBETHKBLHGZ7ECGONMEW63JXLUDWDJ2HFKRAEZRDTV7C4HTNFC7RCFZM'
  },
  {
    code: 'BTC',
    issuer: 'GCBTCBUQMSMNE6NC7OQZJMC3QYRL77LV5BWKJK2QQQCFZB3YPLAW7MJI'
  }
];

// Activo base (XLM)
const baseAsset = Asset.native(); // XLM

const getPrice = async (counterAsset) => {
  try {
    const book = await server.orderbook(baseAsset, new Asset(counterAsset.code, counterAsset.issuer)).call();

    if (!book.asks.length) {
      console.log(`⚠️  No hay órdenes activas para XLM/${counterAsset.code}`);
      return;
    }

    const bestAsk = book.asks[0];
    console.log(`💱 XLM/${counterAsset.code}: ${parseFloat(bestAsk.price).toFixed(7)} ${counterAsset.code}`);
  } catch (e) {
    console.error(`❌ Error al consultar XLM/${counterAsset.code}:`, e.response?.data || e.message || e);
  }
};

(async () => {
  console.log('📊 Consultando precios desde Stellar DEX (testnet)...\n');

  for (const asset of assets) {
    await getPrice(asset);
  }
})();
