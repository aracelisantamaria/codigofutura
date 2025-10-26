# 💫 Proyecto: Buen Día Builders Token (BDB)
# MI TOKEN COBRA VIDA ✨

## 📘 Descripción General

Este proyecto consiste en la creación, compilación, deploy e interacción con un **token fungible (BDB)** en la **blockchain de Stellar (Soroban Testnet)**, incluyendo la conexión con un **frontend React + Vite + TypeScript** y la **integración con la wallet Freighter**.

El objetivo fue comprender el ciclo completo de desarrollo de un **Smart Contract en Rust**, desde los conceptos base del lenguaje hasta su uso real en una blockchain.

---

## 📋 Pre-requisitos Técnicos

### 🦀 Conocimientos Fundamentales en Rust

#### `Option<T>` – Ausencia de valores
Representa un valor que puede o no existir.  
👉 Se usa cuando **algo legítimamente puede no existir** y eso **no es un error**.

#### `Result<T, E>` – Manejo de errores
Representa una operación que puede tener éxito o fallar.  
👉 Se usa cuando **una operación puede fallar** y necesitas saber **por qué**.

---

### ⚙️ Traits – “Contratos de comportamiento”

Un **trait** es un contrato que define qué funciones debe tener un tipo.  
Similar a las **interfaces** en otros lenguajes.

**Ejemplo:**
```rust
trait Vehiculo {
  fn acelerar(&self);
  fn frenar(&self);
}
Ventajas:

✅ Garantiza funciones requeridas en tu token

✅ Compatible con wallets, DEXs, etc.

✅ Documentación clara de la interfaz

🧠 Ownership y Borrowing
Ownership: sistema de Rust para gestionar memoria sin garbage collector.

Reglas de oro:

Cada valor tiene un único dueño.

Solo puede haber un dueño a la vez.

Cuando el dueño sale del scope, el valor se destruye.

Borrowing: pedir prestado un valor sin tomar ownership.

&T → préstamo inmutable (solo lectura)

&mut T → préstamo mutable (lectura y escritura)

🧩 Conceptos Blockchain
💰 ¿Qué es un token?
Un token es una representación digital de valor dentro de una blockchain.
Puede representar dinero, puntos, acciones o cualquier activo.

Tipos:

Fungible: todos los tokens valen lo mismo (como una moneda).
Ejemplo: $10 = $10 → equivalentes.

🧱 Almacenamiento del contrato
Tipo	Uso	Descripción
Instance Storage	Metadatos (admin, name, symbol)	Compartido entre invocaciones
Persistent Storage	Balances, allowances	Específico por key, requiere TTL

⚙️ Funciones principales del Token
Función	Descripción
initialize()	Configura nombre, símbolo y decimales
mint()	Crea nuevos tokens (solo admin)
burn()	Destruye tokens permanentemente
transfer()	Envía tokens entre cuentas
approve()	Autoriza a otro address a gastar tus tokens
balance()	Consulta el saldo de una cuenta
allowance()	Muestra cuánto puede gastar un address autorizado

💡 Tips Clave
🧠 “En blockchain, el código ES la ley. Una vez deployado, no hay Ctrl+Z.”

🧩 Usa Result<T, Error> en lugar de panic! en producción.
🕓 Extiende el TTL en testnet para evitar que tus datos expiren.
🧪 Los tests son tu red de seguridad.

⚙️ Guía de Compilación
✅ Requisitos Previos
bash
Copiar código
rustc --version      # >= 1.74.0
cargo --version      # >= 1.74.0
stellar --version    # >= 21.0.0
Paso 1: Configurar el proyecto
bash
Copiar código
mkdir token_bdb
cd token_bdb
cargo init --lib
Paso 2: Configurar el Target WASM
bash
Copiar código
rustup target add wasm32-unknown-unknown
Paso 3: Compilar el contrato
bash
Copiar código
cargo build --target wasm32-unknown-unknown --release
📁 Salida esperada:
target/wasm32-unknown-unknown/release/token_bdb.wasm

🧪 Testing
bash
Copiar código
cargo test
Ejemplos:

bash
Copiar código
cargo test test_initialize
cargo test test_mint_and_balance -- --nocapture
cargo test test_transfer -- --nocapture
cargo test test_initialize_empty_name_fails
🚀 Deploy a Testnet
Paso 1: Crear una cuenta
bash
Copiar código
stellar keys generate --name Araceli --network testnet
stellar keys address Araceli
stellar keys fund Araceli --network testnet
✅ Cuenta creada y fondeada con XLM gratis.

Paso 2: Deploy del contrato
bash
Copiar código
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/token_bdb.wasm \
  --source Araceli \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org
📋 Contract ID:

nginx
Copiar código
CDAEHINBDDGBRFM2HB23ZKVZHRIYWCYYZZ7A3T7PMGSE6BQVDSXEINK6
🔗 Explorer:
https://stellar.expert/explorer/testnet/contract/CDAEHINBDDGBRFM2HB23ZKVZHRIYWCYYZZ7A3T7PMGSE6BQVDSXEINK6

Paso 3: Inicializar el Token
bash
Copiar código
stellar contract invoke \
  --id $CONTRACT_ID \
  --source Araceli \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  initialize \
  --admin GCWAKVZ46AYKSD5YZE4JB6EUNVYN6YZI3RP6QTVQOEUUKFOU4JGZ2RQP \
  --name "Buen Dia Builders Token" \
  --symbol "BDB" \
  --decimals 7
Paso 4: Mintear Tokens
bash
Copiar código
stellar contract invoke \
  --id $CONTRACT_ID \
  --source Araceli \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  mint \
  --to GCWAKVZ46AYKSD5YZE4JB6EUNVYN6YZI3RP6QTVQOEUUKFOU4JGZ2RQP \
  --amount 10000000000000
💰 Esto equivale a 1,000,000 tokens (7 decimales).

Verificar balance:

bash
Copiar código
stellar contract invoke \
  --id $CONTRACT_ID \
  --source Araceli \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  balance \
  --account GCWAKVZ46AYKSD5YZE4JB6EUNVYN6YZI3RP6QTVQOEUUKFOU4JGZ2RQP
💻 Frontend: React + Vite + Freighter
Paso 1: Estructura del proyecto
css
Copiar código
mi-token-bdb/
├── contracts/
│   └── buen_dia_token/
│       ├── src/lib.rs
│       └── Cargo.toml
├── src/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── .env
└── environments.toml
Paso 2: Configuración del entorno .env
bash
Copiar código
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_BDB_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Paso 3: Instalar dependencias
bash
Copiar código
npm install
npm install @stellar/freighter-api @stellar/stellar-sdk
Paso 4: Generar cliente TypeScript
bash
Copiar código
npm run build:contracts
📂 Genera automáticamente el cliente en src/contracts/.

Paso 5: Ejecutar el servidor
bash
Copiar código
npm run dev
🌐 Abre: http://localhost:5173/

Deberías ver el frontend funcionando sin errores 🎉

🔐 Conectar Freighter Wallet
Instalar la extensión Freighter en Chrome/Firefox.

Importar tu cuenta testnet.

Verificar que estás en Testnet y con XLM disponible.

Conectar desde el frontend (App.tsx).

📚 Glosario Rápido
Término	Significado
WASM	Código Rust compilado para blockchain
Contract ID	Identificador único del contrato
Testnet	Red de práctica sin valor monetario
Public Key	Dirección pública (empieza con G)
Secret Key	Clave privada (empieza con S, ¡no compartir!)

🎓 Aprendizajes Finales
✅ Configurar un proyecto Soroban desde cero
✅ Compilar y optimizar un contrato en WASM
✅ Ejecutar tests unitarios
✅ Deployar y mintear tokens en Testnet
✅ Integrar el contrato con un frontend React
✅ Conectar y firmar transacciones con Freighter

🚀 Resultado Final
📦 Contrato Deployado Exitosamente

Item	Valor
Estado	✅ Deployado
Contract ID	CDE3KHSJJR3355SJDU3RSBKZH766UGGVE37UGHOBTRJGR7KLT5MFOOUN
Red	Stellar Testnet
Dueño	Araceli
Token	Buen Día Builders Token (BDB)

🔗 Ver en Stellar Expert

✨ ¡Felicitaciones!
Tu contrato está vivo en la blockchain de Stellar.
Has completado con éxito todas las etapas del ciclo de desarrollo Web3 🚀