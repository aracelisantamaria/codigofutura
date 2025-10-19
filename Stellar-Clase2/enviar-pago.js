import {
  Horizon, // Horizon: Es la API de Stellar. Es como la puerta de entrada a blockchain.
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
  Memo
} from '@stellar/stellar-sdk';
import 'dotenv/config'; // Importa dotenv automáticamente

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;
const SECRET_KEY = process.env.SECRET_KEY;

// Cuentas destino
const DESTINATIONS = [
    { publicKey: process.env.DESTINATION_KEY_1, memo: "Pago-001" },
    { publicKey: process.env.DESTINATION_KEY_2, memo: "Pago-002" },
    { publicKey: process.env.DESTINATION_KEY_3, memo: "Pago-003" }
];

async function enviarPago(amount, memo = '') {
  try {
    console.log('🚀 Iniciando pago...\n');
    
    // Paso 1: Cargar tu cuenta
    const sourceKeys = Keypair.fromSecret(SECRET_KEY); // Crear objeto Keypair desde tu secret key.
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey()); // Cargar datos de tu cuenta desde blockchain (balance, sequence number).
    
    console.log(`Balance actual: ${sourceAccount.balances[0].balance} XLM\n`);
    
    for (let i = 0; i < DESTINATIONS.length; i++) {
      const { publicKey, memo } = DESTINATIONS[i];
      console.log(`💸 Enviando pago ${i + 1} a: ${publicKey}`);
      
      // Paso 2: Construir transacción
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase
      })
        .addOperation(Operation.payment({
        destination: publicKey,
        asset: Asset.native(),
        amount: amount
        }))
        .addMemo(memo ? Memo.text(memo) : Memo.none())
        .setTimeout(30)
        .build();
    
      // Paso 3: Firmar
      transaction.sign(sourceKeys);
    
      // Paso 4: Enviar
      const result = await server.submitTransaction(transaction);
    
      console.log(`🎉 ¡Pago a destinatario ${i + 1} exitoso!`);
      console.log(`💰 Enviaste: ${amount} XLM`);
      console.log(`🔗 Hash: ${result.hash}\n`);
        
    }
 
  } catch (error) {
    console.error('❌ ERROR al enviar:');
    if (error.response && error.response.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.extras) {
      console.log(JSON.stringify(error.extras, null, 2));
    } else {
      console.error(error);
    }
  }
}

enviarPago('2','¡Pago de prueba!');