import { Horizon } from '@stellar/stellar-sdk'; // Trae la función Keypair del SDK de Stellar. Sin esto, JavaScript no sabe qué es Keypair.
import 'dotenv/config';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
 // Cuentas a consultar
const PUBLIC_KEYS = [
  process.env.PUBLIC_KEY_1,
  process.env.PUBLIC_KEY_2,
  process.env.PUBLIC_KEY_3
];


async function consultarBalance(publicKey, index) { // Hablar con blockchain no es instantáneo. Necesitamos esperar respuestas.
  try {
    console.log(`🔍 Consultando cuenta #${index + 1}: ${publicKey.substring(0, 8)}...\n`);
    
    const account = await server.loadAccount(publicKey);

    // Balance de XLM
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')?.balance || '0';

    // Número de trustlines (excluyendo XLM)
    const trustlines = account.balances.filter(b => b.asset_type !== 'native').length;

    // Sequence number
    const sequence = account.sequenceNumber();
    
    console.log('╔═══════════════════════════════════╗');
    console.log(`📊 INFORMACIÓN DE CUENTA #${index + 1}`);
    console.log('╚═══════════════════════════════════╝\n');
    
    console.log(`📧 Account ID:`);
    console.log(`   ${account.id}\n`);
    
    console.log(`🔢 Sequence Number:`);
    console.log(`   ${account.sequenceNumber()}\n`);
    
    console.log('╔═══════════════════════════════════╗');
    console.log('💰 BALANCES');
    console.log('╚═══════════════════════════════════╝\n');
    
    account.balances.forEach((balance, index) => {
      if (balance.asset_type === 'native') {
        console.log(`${index + 1}. 🌟 XLM (Lumens):`);
        console.log(`   Total: ${balance.balance} XLM`);
        
        const baseReserve = 0.5; // Stellar bloquea una pequeña cantidad de XLM en cada cuenta
        const subentryReserve = account.subentry_count * 0.5;
        const totalReserve = baseReserve + subentryReserve;
        const available = parseFloat(balance.balance) - totalReserve;
        
        console.log(`   Bloqueado: ${totalReserve.toFixed(7)} XLM`);
        console.log(`   Disponible: ${available.toFixed(7)} XLM\n`);
      } else {
        console.log(`${index + 1}. 🪙 ${balance.asset_code}:`);
        console.log(`   Balance: ${balance.balance}`);
        console.log(`   Emisor: ${balance.asset_issuer.substring(0, 8)}...\n`);
      }
    });
    
    return account;
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('❌ Cuenta no encontrada');
      console.log('💡 Posibles causas:');
      console.log('   - La cuenta nunca fue creada/fondeada');
      console.log('   - Error de tipeo en la public key\n');
    } else {
      console.error('❌ Error:', error.message);
    }
    throw error;
  }
}

async function consultar_Balance() {
  console.log('=== MONITOR DE CUENTAS ===\n');
  for (let i = 0; i < PUBLIC_KEYS.length; i++) {
    await consultarBalance(PUBLIC_KEYS[i], i);
  }
}

consultar_Balance();