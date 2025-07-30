# 🌟 Recuperar entorno de pruebas para Stellar SDK (.cjs)

Este documento te ayuda a recuperar rápidamente tu entorno local si el script de creación de cuentas en la testnet de Stellar deja de funcionar por un error del tipo:

```bash
TypeError: Server is not a constructor
```

---

## ✅ Causa del problema

Este error aparece cuando accidentalmente instalas una versión moderna del SDK que no funciona con `require()` ni con scripts `.cjs`. Ejemplo de versiones problemáticas:

- `@stellar/stellar-sdk@13.x`
- `stellar-sdk@10+`

Estas versiones solo funcionan bien con `import` y ESM.

---

## ✅ Solución rápida

### 1. Desinstala cualquier versión incompatible:

```bash
npm uninstall @stellar/stellar-sdk stellar-sdk
```

### 2. Instala la versión compatible (funciona perfecto con `.cjs` y `require()`):

```bash
npm install stellar-sdk@8.2.3
```

---

## 🧪 Para validar que todo está bien

Ejecuta tu script de prueba:

```bash
node scripts/stellar/test-create-account.cjs
```

Y deberías ver algo como:

```
🔐 Public Key: GBJDTATBCDDB4GPBZGQ2XICE5OFZTJQA6EHVR7XVV6KT5WRREIWPPSKE
🔑 Secret Key: SD2JDIITSVUHOT2SCXYWNDOKIAAJGJPXP543PNOU3GWFAITCCAE3BA7L
✅ Cuenta fondeada
✅ Cuenta existe
💰 Balances: [
  {
    balance: '10000.0000000',
    buying_liabilities: '0.0000000',
    selling_liabilities: '0.0000000',
    asset_type: 'native'
  }
]
```

---

## 📜 Recomendación
Si vas a trabajar con scripts locales (CLI, automatizaciones), **mantente en `stellar-sdk@8.2.3`**. Guarda tus claves y versiones en un archivo de control como:

```md
scripts/stellar/accounts-testnet.md
```

Esto evitará confusiones futuras y tendrás siempre una copia de tus llaves y contexto de pruebas.

---

## 📃 Cuentas creadas:

```bash
PS C:\Galaxy\galaxy-smart-wallet> node scripts/stellar/test-create-account.cjs
🔐 Public Key: GDCETSDOQ5YRZ45SSHVZXXZP4RT6XORADPEVZB2HCAS6NT3UI3LUYH5P
🔑 Secret Key: SBUI2RZV3GH6QZHQFOZP7DQI5HD7AD6FAJUVHSGMVO4QJVX6BCWJAU7F
✅ Cuenta fondeada
✅ Cuenta existe
💰 Balances: [
  {
    balance: '10000.0000000',
    buying_liabilities: '0.0000000',
    selling_liabilities: '0.0000000',
    asset_type: 'native'
  }
]

PS C:\Galaxy\galaxy-smart-wallet> node scripts/stellar/test-create-account.cjs
🔐 Public Key: GBXRDFAKXIAOEYJ5V4W73XA4CSFN6CLXMS3VQSFEJBQQ7X2XY26D7WUU
🔑 Secret Key: SA53ZMBJ5N6Y4T6RKHKQPGK2PHOBMBNGJZ6GYKY5MO4VK5OIUVLX5SE5
✅ Cuenta fondeada
✅ Cuenta existe
💰 Balances: [
  {
    balance: '10000.0000000',
    buying_liabilities: '0.0000000',
    selling_liabilities: '0.0000000',
    asset_type: 'native'
  }
]
```

---

