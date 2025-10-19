# Stellar SDK - Clase 2

Este proyecto es para aprender a usar la **Stellar SDK** en JavaScript y experimentar con cuentas, pagos y consultas de balances en la **Testnet** de Stellar.

---
## Requisitos
- Node.js
- npm

## Instalación
```bash
npm install
```
  
## 🗂 Archivos principales

- **`crear-cuenta.js`**  
  Crea 5 nuevas cuentas automáticamente en la Testnet de Stellar y muestra:  
  - 🌟 Clave pública  
  - 🔑 Clave secreta  
**Ejemplo de salida:**

> Creando cuenta 1...
>
> ✅ ¡Cuenta 1 creada!
>
> Public Key: GBXXXX...ABCD
>
> Secret Key: SAXXXX...1234


- **`enviar-pago.js`**  
  Envía pagos en XLM desde una cuenta a otras múltiples destinos de la Testnet.  
  Se puede configurar:  
  - 💰 Monto  
  - 📝 Memo  
**Ejemplo de salida:**
> 🚀 Iniciando pago...
> 
> 💸 Enviando pago 1 a: GBXXX...123
> 
> 🎉 ¡Pago a destinatario 1 exitoso!
> 
> 💰 Enviaste: 2 XLM
> 
> 🔗 Hash: e2d730f8...  

- **`ver-balance.js`**  
  Verifica balances de múltiples cuentas y la muestra de manera legible:  
  - 💸 Balance de XLM  
  - 🔗 Número de trustlines activos  
  - 🔢 Sequence number  
**Ejemplo de salida:**
> === MONITOR DE CUENTAS ===
> 
> Consultando cuenta #1: GAFPTUCB...
> 
> ╔═══════════════════════════════════╗
> 
>    INFORMACIÓN DE CUENTA #1
> 
> ╚═══════════════════════════════════╝
> 
> Account ID: GAFPTUCB2K2EKHBRYJAFSX3WP77OJOJXSJFUQKFADBDERKLMBUTKDOBE
> 
> Sequence Number: 4241851435450369
> 

> ╔═══════════════════════════════════╗
>
>    BALANCES
>
> ╚═══════════════════════════════════╝
> 1. XLM (Lumens):
> 
>    Total: 10109.9999900 XLM
>    
>    Bloqueado: 0.5000000 XLM
>    
>    Disponible: 10109.4999900 XLM
>    

---

## ⚙️ Cómo usar

1. **Clonar el repositorio:**

```bash
git clone <tu-repo-url>
cd <nombre-del-repo>
```

## ⚙️ Cómo ejecutar los scripts

```bash
node crear-cuenta.js
node enviar-pago.js
node consultar-balance.js
```
