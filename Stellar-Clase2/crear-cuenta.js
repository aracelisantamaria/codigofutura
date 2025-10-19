// crear-cuenta.js
// Script para crear 5 cuentas Stellar en Tesnet

import { Keypair } from '@stellar/stellar-sdk'; // Trae la función Keypair del SDK de Stellar. Sin esto, JavaScript no sabe qué es Keypair.
import dotenv from 'dotenv';
dotenv.config();

const cuentas = []; // Array para guardar la información.

async function crearCuenta() { // Hablar con blockchain no es instantáneo. Necesitamos esperar respuestas. Por eso se usa función asincrónica.
  for (let i = 1; i <= 5; i++) {
    console.log(`\n🔐 Creando cuenta ${i}...`);
    
    // Generar llaves criptográficamente seguras, aleatorias
    const pair = Keypair.random();
    const publicKey = pair.publicKey();
    const secretKey = pair.secret();
    const balance = "10000.0000000"; // Friendbot siempre deposita 10000 XLM
    
    console.log(`\n✅ ¡Cuenta ${i} creada!`);
    console.log('📧 PUBLIC KEY (puedes compartir):', publicKey); // Empieza con 'G' - Puedes compartirla
    console.log('\n🔑 SECRET KEY (NUNCA COMPARTIR):', secretKey ); // Empieza con 'S' - NUNCA compartir
   
    
    // Fondear con Friendbot
    console.log('\n💰 Fondeando con Friendbot...');
    
    try {
      const response = await fetch(
        `https://friendbot.stellar.org/?addr=${pair.publicKey()}`
      );
      
      const result = await response.json();
      
      if (result.successful || response.ok) {
        console.log('✅ ¡Cuenta fondeada con 10,000 XLM!\n');
        console.log('🔗 Transaction hash:', result.hash);
      }
    
    // Guardar en el array
    cuentas.push({
      numero: i,
      publicKey,
      secretKey,
      balance
    });

    } catch (error) {
      console.error('❌ Error al fondear:', error.message);
    }
    
  }
  console.log('\n⚠️  IMPORTANTE: Guarda estas llaves en un lugar seguro\n');
  console.log(cuentas);
}
crearCuenta();