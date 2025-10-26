# 🚀 Token BDB - Buen Día Builder

Guía completa para crear, compilar y deployar un token fungible en Stellar Soroban usando Rust.

---

## 📋 Tabla de Contenidos

- [Pre-requisitos](#-pre-requisitos)
- [Conceptos Fundamentales](#-conceptos-fundamentales)
- [Configuración del Proyecto](#-configuración-del-proyecto)
- [Compilación](#-compilación)
- [Testing](#-testing)
- [Deploy a Testnet](#-deploy-a-testnet)
- [Integración con Frontend](#-integración-con-frontend)
- [Glosario](#-glosario)
- [Tips y Troubleshooting](#-tips-y-troubleshooting)

---

## 🎯 Pre-requisitos

### Software Necesario

```bash
# Verificar instalaciones
rustc --version        # Debe ser 1.74.0+
cargo --version        # Debe ser 1.74.0+
stellar --version      # Debe ser 21.0.0+
node --version         # Debe ser v22.0.0+
```

### Conocimientos Técnicos Requeridos

#### Option<T> y Result<T, E>

- **`Option<T>`**: Representa un valor que puede o no existir
  - **¿Cuándo usarlo?** Cuando algo legítimamente puede no existir y eso no es un error
  
- **`Result<T, E>`**: Representa una operación que puede tener éxito o fallar
  - **¿Cuándo usarlo?** Cuando una operación puede fallar y necesitas información sobre por qué falló

#### Traits: "Contratos de Comportamiento"

Un trait es como un contrato que define qué funciones debe tener un tipo (similar a interfaces en otros lenguajes).

**Beneficios:**
- ✅ Garantiza que tu token tiene todas las funciones requeridas
- ✅ Compatible con wallets, DEXs, etc.
- ✅ Documentación clara de la interfaz

#### Ownership y Borrowing

**Las 3 reglas de oro del Ownership:**
1. Cada valor tiene un único dueño
2. Solo puede haber un dueño a la vez
3. Cuando el dueño sale del scope, el valor se destruye

**Borrowing (Préstamo):**
- **Inmutable (`&T`)**: Puedes leer, pero no modificar
- **Mutable (`&mut T`)**: Puedes leer y modificar

---

## 💡 Conceptos Fundamentales

### ¿Qué es un Token en Blockchain?

Un token es una versión digital de algo con valor que vive dentro de una blockchain.

- **Fungible**: Tokens idénticos e intercambiables entre sí (como dinero)
- Es como una ficha o moneda virtual que no depende de un banco, sino del código

### Storage en Soroban

#### Instance Storage
- Para metadatos del contrato (admin, name, symbol)
- Compartido entre todas las invocaciones
- Más barato

#### Persistent Storage
- Para datos de usuarios (balances, allowances)
- Específico por key
- Requiere gestión de TTL

### Funciones Core de un Token

1. **`initialize()`** - Configurar el token (nombre, símbolo, decimales)
2. **`mint()`** - Crear nuevos tokens (solo admin, aumenta supply total)
3. **`burn()`** - Destruir tokens permanentemente (reduce supply total)
4. **`transfer()`** - Enviar tokens entre cuentas
5. **`approve()`** - Autorizar a otro address a gastar tus tokens
6. **`balance()`** - Consultar saldo de una cuenta
7. **`allowance()`** - Ver cuánto puede gastar un address autorizado

---

## 🔨 Configuración del Proyecto

### Paso 1: Crear el Proyecto (5 min)

```bash
# Crear carpeta del proyecto
mkdir token_bdb
cd token_bdb

# Inicializar proyecto Rust
cargo init --lib
```

💡 `cargo init --lib` crea un proyecto de librería (necesario para contratos Soroban)

### Paso 2: Configurar Target WASM

```bash
# Instalar target wasm32 (solo la primera vez)
rustup target add wasm32-unknown-unknown
```

---

## 🏗️ Compilación

### Build en Modo Desarrollo (Debug)

```bash
cargo build
```

**Características:**
- ✅ Compilación rápida
- ✅ Incluye información de debug
- ❌ No optimizado (más lento en ejecución)
- 📁 Output: `target/debug/`

**Cuándo usarlo:** Durante desarrollo para probar cambios rápido

### Build en Modo Release (Producción)

```bash
cargo build --release
```

**Características:**
- ⏰ Compilación lenta (más optimizaciones)
- ✅ Código altamente optimizado
- ✅ Ejecutable más rápido
- ❌ Sin información de debug
- 📁 Output: `target/release/`

**Cuándo usarlo:** Para producción, benchmarks, deploy

### Build para WebAssembly (Soroban)

```bash
# Método recomendado
stellar contract build

# O manualmente
cargo build --target wasm32-unknown-unknown --release
```

📁 Output: `target/wasm32-unknown-unknown/release/`

### Optimizar WASM (Recomendado)

```bash
# Instalar wasm-opt
cargo install wasm-opt

# Optimizar el WASM
wasm-opt -Oz \
  target/wasm32-unknown-unknown/release/token_bdb.wasm \
  -o target/wasm32-unknown-unknown/release/token_bdb_optimized.wasm
```

**Beneficios:**
- Reduce el tamaño 30-50%
- Ahorra costos de storage en blockchain
- Mantiene toda la funcionalidad

---

## 🧪 Testing

### Ejecutar Todos los Tests

```bash
cargo test
```

### Ejecutar Tests Específicos

```bash
# Test de inicialización
cargo test test_initialize

# Test de mint
cargo test test_mint_and_balance -- --nocapture

# Test de transferencias
cargo test test_transfer -- --nocapture

# Test de validaciones
cargo test test_initialize_empty_name_fails
cargo test test_initialize_empty_symbol_fails
```

### Tests con Output Detallado

```bash
cargo test -- --nocapture
```

### Tests Automáticos (Watch Mode)

```bash
# Instalar cargo-watch
cargo install cargo-watch

# Ejecutar tests automáticamente al cambiar archivos
cargo watch -x test
```

### Code Coverage (Solo Linux)

```bash
# Instalar cargo-tarpaulin
cargo install cargo-tarpaulin

# Generar reporte de cobertura
cargo tarpaulin --out Html
```

---

## 🚀 Deploy a Testnet

### Paso 1: Configurar Cuenta

```bash
# Generar nueva identidad
stellar keys generate --name alice --network testnet

# Listar todas las claves
stellar keys ls

# Ver dirección pública
stellar keys address alice

# Fondear con XLM gratis
stellar keys fund alice --network testnet

# O usar curl
publicKey=$(stellar keys address alice)
curl "https://friendbot.stellar.org?addr=$publicKey"
```

### Paso 2: Deploy del Contrato

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/token_bdb.wasm \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org
```

**Guarda el Contract ID que devuelve:**

```bash
CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 3: Inicializar el Token

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  initialize \
  --admin GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --name "Buen Dia Builders Token" \
  --symbol "BDB" \
  --decimals 7
```

### Paso 4: Verificar Inicialización

```bash
# Ver nombre
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  name

# Ver símbolo
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  symbol

# Ver decimales
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  decimals
```

### Paso 5: Mintear Tokens

```bash
# Mintear 1,000,000 tokens (con 7 decimales)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  mint \
  --to GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --amount 10000000000000
```

💡 **Nota:** `10000000000000 = 1,000,000` tokens (con 7 decimales)

### Paso 6: Verificar Balance

```bash
# Ver balance de una cuenta
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  balance \
  --account GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Ver supply total
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  -- \
  total_supply
```

---

## 🌐 Integración con Frontend

### Paso 1: Crear Proyecto Scaffold

```bash
# Salir de la carpeta del contrato
cd ..

# Crear proyecto frontend
npx create-stellar-app@latest mi-token-bdb
cd mi-token-bdb
```

### Paso 2: Copiar tu Contrato

```bash
# Copiar contrato al proyecto scaffold
cp -r ~/ruta/a/token-bdb ./contracts/buen_dia_token
```

### Paso 3: Configurar Variables de Entorno

Crear archivo `.env`:

```bash
# ===================================
# CONFIGURACIÓN DE RED
# ===================================

VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# ===================================
# TU CONTRATO BDB
# ===================================

VITE_BDB_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 4: Instalar Dependencias

```bash
# Dependencias base
npm install

# Verificar dependencias Stellar
npm list @stellar/freighter-api @stellar/stellar-sdk
```

### Paso 5: Generar Cliente TypeScript

```bash
npm run build:contracts
```

Este comando:
- Lee tu contrato WASM
- Analiza todas las funciones públicas
- Genera automáticamente código TypeScript
- Crea tipos seguros para interactuar con el contrato

### Paso 6: Instalar Freighter Wallet

1. Instala la extensión [Freighter](https://freighter.app) en Chrome/Firefox
2. Crea o importa una cuenta
3. Cambia a **Testnet**
4. Fondea tu cuenta con XLM

### Paso 7: Ejecutar el Frontend

```bash
npm run dev
```

Abre `http://localhost:5173/` en tu navegador

---

## 📚 Glosario

| Término | Descripción |
|---------|-------------|
| **WASM** | WebAssembly - Tu código Rust compilado en formato ejecutable por blockchain |
| **Contract ID** | Identificador único del contrato (empieza con "C") |
| **Network Passphrase** | Define si estás en Testnet o Mainnet |
| **Testnet** | Blockchain de práctica (XLM gratis, sin valor monetario) |
| **Public Key** | Tu dirección pública (empieza con "G") |
| **Secret Key** | Tu contraseña privada (empieza con "S") - ¡NUNCA la compartas! |
| **XLM** | Token nativo de Stellar (para pagar fees) |
| **TTL** | Time To Live - Tiempo que los datos persisten en storage |

---

## 💡 Tips y Troubleshooting

### Tips Clave

> "En blockchain, el código ES la ley. Una vez deployado, no hay Ctrl+Z"

> "Siempre usa `Result<T, Error>` en lugar de `panic!` para production"

> "Extender TTL es crítico en testnet para que tus datos no expiren"

> "Los tests no son opcionales - son tu red de seguridad"

### Errores Comunes

#### Error: "could not find `Cargo.toml`"

**Solución:** Asegúrate de ejecutar los comandos desde la carpeta del proyecto

```bash
cd token_bdb
cargo build --target wasm32-unknown-unknown --release
```

#### Error: Certificados SSL en Windows

Si ves errores SSL/TLS:

```bash
# Descargar certificados manualmente
curl -O https://curl.se/ca/cacert.pem
set SSL_CERT_FILE=cacert.pem
```

#### Error: "wasm file not found"

Verifica el nombre en `Cargo.toml`:

```bash
cat Cargo.toml | grep "name ="
```

El archivo WASM se llamará `[name].wasm`

#### Build limpio

Si tienes problemas de compilación:

```bash
cargo clean
stellar contract build
```

---

## 🎓 Lo que Aprendiste

Al completar este proyecto, has logrado:

- ✅ Configurar un proyecto Soroban desde cero
- ✅ Compilar un smart contract a WASM
- ✅ Ejecutar tests unitarios
- ✅ Entender el flujo completo de desarrollo
- ✅ Deployar en blockchain (testnet)
- ✅ Integrar con un frontend React
- ✅ Conectar wallets (Freighter)
- ✅ Interactuar con contratos desde el navegador

---

## 🔗 Enlaces Útiles

- [Stellar Docs](https://docs.stellar.org)
- [Soroban Docs](https://soroban.stellar.org)
- [Freighter Wallet](https://freighter.app)
- [Stellar Expert (Explorador)](https://stellar.expert)
- [Friendbot (XLM Testnet)](https://laboratory.stellar.org/#account-creator?network=test)

---

## 📝 Licencia

Este proyecto es de código abierto .

---

**¡Felicitaciones por completar tu primer token en Stellar! 🎉**
