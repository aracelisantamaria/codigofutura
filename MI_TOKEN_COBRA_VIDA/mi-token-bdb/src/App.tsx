// ========================================
// IMPORTS
// ========================================
import { useState, useEffect } from 'react'
import * as freighterApi from '@stellar/freighter-api'
import { Client as TokenBdbClient } from './bdb-token-client'

// ========================================
// TEMAS DE COLORES
// ========================================
const themes = {
  dark: {
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    cardBg: 'rgba(15, 32, 39, 0.95)',
    cardBorder: 'rgba(0, 255, 255, 0.2)',
    primaryColor: '#00ffff',
    secondaryColor: '#7dd3c0',
    textColor: '#a0efe8',
    buttonBg: 'linear-gradient(135deg, #00d4aa 0%, #00ffcc 100%)',
    buttonText: '#0f2027',
    transferBg: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 87, 87, 0.1) 100%)',
    transferBorder: 'rgba(255, 107, 107, 0.3)',
    transferButton: '#ff6b6b',
    infoBg: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(125, 211, 192, 0.15) 100%)',
    infoBorder: 'rgba(0, 255, 255, 0.3)',
    balanceBg: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(125, 211, 192, 0.2) 100%)',
    balanceBorder: 'rgba(0, 255, 255, 0.4)',
    inputBg: 'rgba(0, 0, 0, 0.3)',
    inputBorder: 'rgba(255, 107, 107, 0.3)',
  },
  light: {
    background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    cardBorder: 'rgba(0, 150, 136, 0.3)',
    primaryColor: '#00796b',
    secondaryColor: '#004d40',
    textColor: '#00695c',
    buttonBg: 'linear-gradient(135deg, #26a69a 0%, #00897b 100%)',
    buttonText: '#ffffff',
    transferBg: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 160, 0, 0.1) 100%)',
    transferBorder: 'rgba(255, 152, 0, 0.4)',
    transferButton: '#ff9800',
    infoBg: 'linear-gradient(135deg, rgba(0, 150, 136, 0.1) 0%, rgba(0, 121, 107, 0.1) 100%)',
    infoBorder: 'rgba(0, 150, 136, 0.3)',
    balanceBg: 'linear-gradient(135deg, rgba(0, 150, 136, 0.15) 0%, rgba(0, 121, 107, 0.15) 100%)',
    balanceBorder: 'rgba(0, 150, 136, 0.4)',
    inputBg: 'rgba(255, 255, 255, 0.6)',
    inputBorder: 'rgba(255, 152, 0, 0.4)',
  }
}

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

  // ESTADO PARA TEMA OSCURO/CLARO
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Leer preferencia guardada al iniciar
    const saved = localStorage.getItem('bdb-theme')
    return saved ? saved === 'dark' : true // Por defecto oscuro
  })

  // Obtener tema actual
  const theme = darkMode ? themes.dark : themes.light

  // Guardar preferencia cuando cambia
  useEffect(() => {
    localStorage.setItem('bdb-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

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

      const transferResult = await client.transfer(
        {
          from: publicKey,
          to: toAddress,
          amount: BigInt(amount * 10000000)
        },
        {
          signTransaction: async (xdr: string) => {
            const signed = await freighterApi.signTransaction(xdr, {
              networkPassphrase: 'Test SDF Network ; September 2015',
              accountToSign: publicKey
            })
            return signed
          }
        }
      )

      console.log('Transfer exitoso:', transferResult)
      alert('¡Transferencia exitosa!')
      
      // Esperar 3 segundos para que se confirme en la blockchain
      setTimeout(() => {
        getBalance()
      }, 3000)
      
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
      background: theme.background,
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        padding: '40px',
        backgroundColor: theme.cardBg,
        borderRadius: '24px',
        boxShadow: darkMode ? '0 20px 60px rgba(0, 255, 255, 0.2)' : '0 20px 60px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.cardBorder}`,
        textAlign: 'center',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        {/* BOTÓN DE TOGGLE TEMA */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 15px',
            fontSize: '20px',
            backgroundColor: theme.buttonBg,
            color: theme.buttonText,
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '80px', marginBottom: '10px' }}>🦈</div>
          <h1 style={{
            color: theme.primaryColor,
            fontSize: '32px',
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            textShadow: darkMode ? '0 0 20px rgba(0, 255, 255, 0.5)' : 'none',
            transition: 'color 0.3s ease'
          }}>
            SharkToken Engineering
          </h1>
          <p style={{ 
            color: theme.secondaryColor, 
            fontSize: '14px', 
            margin: '0', 
            fontStyle: 'italic',
            transition: 'color 0.3s ease'
          }}>
            por Araceli 🌊⚡
          </p>
        </div>

        {!connected ? (
          <div>
            <div style={{
              padding: '30px 20px',
              background: theme.infoBg,
              borderRadius: '16px',
              marginBottom: '30px',
              border: `1px solid ${theme.infoBorder}`,
              transition: 'all 0.3s ease'
            }}>
              <p style={{ 
                color: theme.textColor, 
                fontSize: '16px', 
                lineHeight: '1.6', 
                margin: '0',
                transition: 'color 0.3s ease'
              }}>
                ¡Bienvenido a mi primera dApp! 🚀<br/>
                Conectá tu wallet Freighter para explorar<br/>
                el Token BDB en Stellar Testnet
              </p>
            </div>
            <button onClick={connectWallet} style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: theme.buttonBg,
              color: theme.buttonText,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: darkMode ? '0 4px 20px rgba(0, 212, 170, 0.5)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
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
              background: theme.infoBg,
              borderRadius: '16px',
              marginBottom: '25px',
              border: `2px solid ${theme.infoBorder}`,
              transition: 'all 0.3s ease'
            }}>
              <p style={{
                fontWeight: 'bold',
                color: theme.primaryColor,
                marginBottom: '12px',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'color 0.3s ease'
              }}>
                ✅ Wallet Conectada
              </p>
              <code style={{
                backgroundColor: theme.inputBg,
                color: theme.secondaryColor,
                padding: '12px',
                borderRadius: '8px',
                display: 'block',
                fontSize: '13px',
                fontWeight: 'bold',
                wordBreak: 'break-all',
                border: `1px solid ${theme.infoBorder}`,
                transition: 'all 0.3s ease'
              }}>
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </code>
            </div>

            <button onClick={getBalance} disabled={loading} style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: loading ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : theme.buttonBg,
              color: loading ? '#718096' : theme.buttonText,
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : (darkMode ? '0 4px 20px rgba(0, 212, 170, 0.5)' : '0 4px 20px rgba(0, 0, 0, 0.2)'),
              transition: 'all 0.3s ease',
              width: '100%',
              marginBottom: '25px'
            }}>
              {loading ? '⏳ Cargando...' : '💰 Consultar Balance BDB'}
            </button>

            <div style={{
              padding: '30px',
              background: theme.balanceBg,
              borderRadius: '16px',
              border: `2px solid ${theme.balanceBorder}`,
              boxShadow: darkMode ? '0 0 30px rgba(0, 255, 255, 0.2)' : '0 0 30px rgba(0, 150, 136, 0.2)',
              marginBottom: '30px',
              transition: 'all 0.3s ease'
            }}>
              <p style={{
                fontSize: '14px',
                margin: '0 0 12px 0',
                color: theme.secondaryColor,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'color 0.3s ease'
              }}>
                🦈 Balance Actual:
              </p>
              <p style={{
                fontSize: '48px',
                fontWeight: 'bold',
                margin: '0',
                color: theme.primaryColor,
                textShadow: darkMode ? '0 0 30px rgba(0, 255, 255, 0.6)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {balance} BDB
              </p>
            </div>

            <div style={{
              padding: '25px',
              background: theme.transferBg,
              borderRadius: '16px',
              border: `2px solid ${theme.transferBorder}`,
              marginBottom: '25px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                color: theme.transferButton,
                fontSize: '20px',
                marginBottom: '20px',
                textShadow: darkMode ? '0 0 10px rgba(255, 107, 107, 0.3)' : 'none',
                transition: 'color 0.3s ease'
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
                  border: `1px solid ${theme.inputBorder}`,
                  fontSize: '14px',
                  backgroundColor: theme.inputBg,
                  color: theme.textColor,
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
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
                  border: `1px solid ${theme.inputBorder}`,
                  fontSize: '14px',
                  backgroundColor: theme.inputBg,
                  color: theme.textColor,
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
              />

              <button
                onClick={transferTokens}
                disabled={transferring}
                style={{
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: transferring ? '#4a5568' : theme.transferButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: transferring ? 'not-allowed' : 'pointer',
                  width: '100%',
                  boxShadow: transferring ? 'none' : `0 4px 20px ${darkMode ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 152, 0, 0.5)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                {transferring ? '⏳ Transfiriendo...' : '🚀 Transferir BDB'}
              </button>
            </div>

            <p style={{
              marginTop: '25px',
              color: theme.secondaryColor,
              fontSize: '12px',
              fontStyle: 'italic',
              transition: 'color 0.3s ease'
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
