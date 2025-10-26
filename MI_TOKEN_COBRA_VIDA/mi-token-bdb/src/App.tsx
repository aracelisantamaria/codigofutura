// ========================================
// IMPORTS
// ========================================
import { useState } from 'react'
import * as freighterApi from '@stellar/freighter-api'
import { Client as TokenBdbClient } from './bdb-token-client'

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
function App() {
  // ========================================
  // ESTADO
  // ========================================
  const [publicKey, setPublicKey] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false)
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(false)
  
  // ESTADO ADICIONAL PARA TRANSFERENCIA
  const [toAddress, setToAddress] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [transferring, setTransferring] = useState<boolean>(false)

  // ========================================
  // FUNCIÓN: Conectar Wallet
  // ========================================
  const connectWallet = async () => {
    try {
      if (await freighterApi.isConnected()) {
        const accessObj = await freighterApi.requestAccess()
        if (accessObj.error) {
          alert('Error: ' + accessObj.error)
          return
        }
        const pk = accessObj.address
        setPublicKey(pk)
        setConnected(true)
        console.log('Wallet conectada:', pk)
      } else {
        alert('Por favor instalá Freighter wallet desde https://freighter.app')
      }
    } catch (error) {
      console.error('Error conectando wallet:', error)
      alert('Error al conectar. Asegurate de que Freighter esté instalado.')
    }
  }

  // ========================================
  // FUNCIÓN: Obtener Balance
  // ========================================
  const getBalance = async () => {
    if (!connected) {
      alert('Conectá tu wallet primero')
      return
    }

    setLoading(true)
    try {
      const contractId = import.meta.env.VITE_BDB_CONTRACT_ID
      const client = new TokenBdbClient({
        contractId: contractId,
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        publicKey: publicKey
      })

      const result = await client.balance({ account: publicKey })
      console.log('Resultado completo:', result)

      let balanceValue = '0'
      if (typeof result === 'string') {
        balanceValue = result
      } else if (typeof result === 'number' || typeof result === 'bigint') {
        balanceValue = result.toString()
      } else if (result && typeof result === 'object') {
        const resultObj = result as any
        balanceValue = resultObj.result || resultObj.value || '0'
      }

      const balanceInTokens = (parseFloat(balanceValue) / 10000000).toFixed(2)
      setBalance(balanceInTokens)
      console.log('Balance raw:', balanceValue)
      console.log('Balance en tokens:', balanceInTokens)
    } catch (error) {
      console.error('Error obteniendo balance:', error)
      alert('Error al obtener balance. Verificá que el contrato esté deployado.')
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // FUNCIÓN: Transferir Tokens
  // ========================================
  const transferTokens = async () => {
    if (!toAddress || amount <= 0) {
      alert('Por favor ingresá una dirección y cantidad válidas')
      return
    }

    if (!toAddress.startsWith('G') || toAddress.length !== 56) {
      alert('Dirección destino inválida. Debe empezar con G y tener 56 caracteres')
      return
    }

    setTransferring(true)
    try {
      const contractId = import.meta.env.VITE_BDB_CONTRACT_ID
      const client = new TokenBdbClient({
        contractId: contractId,
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        publicKey: publicKey
      })

      // Construir la transacción
      const tx = await client.transfer({
        from: publicKey,
        to: toAddress,
        amount: BigInt(amount * 10000000)
      })

      console.log('Transacción construida, firmando y enviando...')

      // Firmar y enviar
      const sentTx = await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          console.log('Solicitando firma en Freighter...')
          const signed = await freighterApi.signTransaction(xdr, {
            networkPassphrase: 'Test SDF Network ; September 2015'
          })
          console.log('Transacción firmada!')
          return signed
        }
      })

      console.log('Transacción enviada, esperando confirmación...')

      // Esperar a que se confirme
      //const result = await sentTx.getTransactionResponse()
      const result = await sentTx.getTransaction()

      console.log('=== RESULTADO ===')
      console.log('Status:', result.status)
      console.log('Result completo:', result)

      if (result.status === 'SUCCESS') {
        alert('¡Transferencia exitosa!')
        setTimeout(() => {
          getBalance()
        }, 4000)
        setToAddress('')
        setAmount(0)
      } else if (result.status === 'FAILED') {
        throw new Error('La transacción falló')
      } else {
        throw new Error('Estado desconocido: ' + result.status)
      }
      
      setToAddress('')
      setAmount(0)
    } catch (error: any) {
      console.error('Error en transfer:', error)
      if (error.message && error.message.includes('User declined')) {
        alert('Transferencia cancelada por el usuario')
      } else {
        alert('Error en la transferencia: ' + error.message)
      }
    } finally {
      setTransferring(false)
    }
  }

  // ========================================
  // INTERFAZ
  // ========================================
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        padding: '40px',
        backgroundColor: 'rgba(15, 32, 39, 0.95)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 255, 255, 0.2)',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '80px', marginBottom: '10px' }}>🦈</div>
          <h1 style={{
            color: '#00ffff',
            fontSize: '32px',
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          }}>
            SharkToken Engineering
          </h1>
          <p style={{ color: '#7dd3c0', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
            por Araceli 🌊⚡
          </p>
        </div>

        {!connected ? (
          <div>
            <div style={{
              padding: '30px 20px',
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(125, 211, 192, 0.1) 100%)',
              borderRadius: '16px',
              marginBottom: '30px',
              border: '1px solid rgba(0, 255, 255, 0.3)'
            }}>
              <p style={{ color: '#a0efe8', fontSize: '16px', lineHeight: '1.6', margin: '0' }}>
                ¡Bienvenido a mi primera dApp! 🚀<br/>
                Conectá tu wallet Freighter para explorar<br/>
                el Token BDB en Stellar Testnet
              </p>
            </div>
            <button onClick={connectWallet} style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00d4aa 0%, #00ffcc 100%)',
              color: '#0f2027',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 212, 170, 0.5)',
              transition: 'all 0.3s ease',
              width: '100%'
            }}>
              🔗 Conectar Freighter Wallet
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(125, 211, 192, 0.15) 100%)',
              borderRadius: '16px',
              marginBottom: '25px',
              border: '2px solid rgba(0, 255, 255, 0.3)'
            }}>
              <p style={{
                fontWeight: 'bold',
                color: '#00ffff',
                marginBottom: '12px',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                ✅ Wallet Conectada
              </p>
              <code style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: '#7dd3c0',
                padding: '12px',
                borderRadius: '8px',
                display: 'block',
                fontSize: '13px',
                fontWeight: 'bold',
                wordBreak: 'break-all',
                border: '1px solid rgba(0, 255, 255, 0.2)'
              }}>
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </code>
            </div>

            <button onClick={getBalance} disabled={loading} style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: loading ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg, #00d4aa 0%, #00ffcc 100%)',
              color: loading ? '#718096' : '#0f2027',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(0, 212, 170, 0.5)',
              transition: 'all 0.3s ease',
              width: '100%',
              marginBottom: '25px'
            }}>
              {loading ? '⏳ Cargando...' : '💰 Consultar Balance BDB'}
            </button>

            <div style={{
              padding: '30px',
              background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(125, 211, 192, 0.2) 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(0, 255, 255, 0.4)',
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
              marginBottom: '30px'
            }}>
              <p style={{
                fontSize: '14px',
                margin: '0 0 12px 0',
                color: '#7dd3c0',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                🦈 Balance Actual:
              </p>
              <p style={{
                fontSize: '48px',
                fontWeight: 'bold',
                margin: '0',
                color: '#00ffff',
                textShadow: '0 0 30px rgba(0, 255, 255, 0.6)'
              }}>
                {balance} BDB
              </p>
            </div>

            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 87, 87, 0.1) 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(255, 107, 107, 0.3)',
              marginBottom: '25px'
            }}>
              <h3 style={{
                color: '#ff6b6b',
                fontSize: '20px',
                marginBottom: '20px',
                textShadow: '0 0 10px rgba(255, 107, 107, 0.3)'
              }}>
                💸 Transferir BDB
              </h3>

              <input
                type="text"
                placeholder="Dirección destino (G...)"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  fontSize: '14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#a0efe8',
                  boxSizing: 'border-box'
                }}
              />

              <input
                type="number"
                placeholder="Cantidad (BDB)"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  fontSize: '14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#a0efe8',
                  boxSizing: 'border-box'
                }}
              />

              <button
                onClick={transferTokens}
                disabled={transferring}
                style={{
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: transferring ? '#4a5568' : '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: transferring ? 'not-allowed' : 'pointer',
                  width: '100%',
                  boxShadow: transferring ? 'none' : '0 4px 20px rgba(255, 107, 107, 0.5)',
                  transition: 'all 0.3s ease'
                }}
              >
                {transferring ? '⏳ Transfiriendo...' : '🚀 Transferir BDB'}
              </button>
            </div>

            <p style={{
              marginTop: '25px',
              color: '#4a7c7a',
              fontSize: '12px',
              fontStyle: 'italic'
            }}>
              Desarrollado con 💙 por una ingeniera que nunca para de aprender
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App