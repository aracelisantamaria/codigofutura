
# Hello Tiburona - Smart Contract en Stellar (Soroban)

Este documento registra el proceso completo de creación, compilación y deployment de un smart contract desarrollado en Rust para la blockchain Stellar usando Soroban SDK.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Requisitos Previos](#requisitos-previos)
- [Teoría y Conceptos](#teoría-y-conceptos)
- [Compilación y Deploy](#compilación-y-deploy)
- [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)
- [Funciones del Contrato](#funciones-del-contrato)
- [Tests](#tests)

---

## 🎯 Descripción

`hello-tiburona` es un smart contract educativo que implementa:
- ✅ Crear un proyecto de smart contract con Stellar CLI
- ✅ Compilar código Rust a WebAssembly (WASM)
- ✅ Configurar identidad y wallet en testnet
- ✅ Deployar contrato en blockchain de Stellar
- ✅ Invocar funciones del contrato desplegado
- ✅ Verificar transacciones en el explorador

---

## 📦 Requisitos Previos

### 1. Rust
```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verificar instalación
rustc --version
cargo --version
```

### 2. Soroban CLI
```bash
# Instalar Soroban CLI
cargo install --locked soroban-cli

# Verificar instalación
soroban --version
```

---


## 📚 Teoría y Conceptos
### 1. **Traits: "Contratos de Comportamiento"**

Un **trait** en Rust define un conjunto de funciones que un tipo debe implementar. Es como un contrato que garantiza que ciertos métodos estarán disponibles.

### 2. **Result y Option - Manejo de Errores**

Rust tiene dos tipos fundamentales para manejar la ausencia de valores o errores:

#### Option<T>
**Uso:** Cuando algo puede **legítimamente no existir**.

```rust
pub fn get_ultimo_saludo(env: Env, usuario: Address) -> Option<Symbol> {
    // Retorna Some(valor) si existe
    // Retorna None si el usuario nunca saludó
    env.storage()
        .persistent()
        .get(&DataKey::UltimoSaludo(usuario))
}
```

**Casos de uso:**
- Buscar un valor que puede no existir
- Configuraciones opcionales
- Datos que no siempre están presentes

#### Result<T, E>
**Uso:** Cuando una operación **puede fallar con información específica del error**.

```rust
pub fn hello(env: Env, usuario: Address, nombre: String) -> Result<Symbol, Error> {
    // Si el nombre está vacío, retorna Err(Error::NombreVacio)
    if nombre.len() == 0 {
        return Err(Error::NombreVacio);
    }
    
    // Si todo está bien, retorna Ok(valor)
    Ok(Symbol::new(&env, "Hola"))
}
```

**Ventajas de Result:**
- ✅ Comunicar QUÉ salió mal
- ✅ Revertir la transacción automáticamente
- ✅ Forzar al llamador a manejar errores
- ✅ Código más seguro y predecible

**Comparación:**

| Tipo | Significado | Ejemplo |
|------|-------------|---------|
| `Option<T>` | "Puede no existir" | Buscar usuario en BD |
| `Result<T, E>` | "Puede fallar" | Validar entrada del usuario |

### 3. **Storage Patterns en Soroban**

Soroban ofrece tres tipos de storage con diferentes características y costos:

#### 📦 Instance Storage
**Uso:** Datos que son **"del contrato"**, no "de usuarios específicos".

```rust
// Ejemplo: Configuración global del contrato
env.storage().instance().set(&DataKey::Admin, &admin);
env.storage().instance().set(&DataKey::ContadorSaludos, &0u32);
```

**Características:**
- ⚡ Más barato en gas
- 🔄 Datos compartidos por todo el contrato
- 📝 Configuraciones, contadores globales, estado del contrato

**Casos de uso:**
- Admin del contrato
- Contador global de operaciones
- Configuración general
- Estado de inicialización

#### 💎 Persistent Storage
**Uso:** Datos que **representan valor o derechos** de usuarios específicos.

```rust
// Ejemplo: Información única de cada usuario
env.storage()
    .persistent()
    .set(&DataKey::UltimoSaludo(usuario.clone()), &nombre);
```

**Características:**
- 💰 Más costoso en gas (pero más duradero)
- 👤 Datos específicos de usuarios
- 🔒 Información crítica que no debe perderse
- ⏳ Requiere gestión de TTL (Time To Live)

**Casos de uso:**
- Balances de tokens
- Ownership de NFTs
- Historial de usuario
- Datos personales importantes

#### ⚡ Temporary Storage
**Uso:** Datos que **NO son críticos** y pueden regenerarse.

```rust
// Ejemplo: Caché temporal de cálculos
env.storage()
    .temporary()
    .set(&DataKey::CacheResultado, &resultado_calculado);
```

**Características:**
- 🚀 El más barato en gas
- ⏰ Vida corta (se borra automáticamente)
- 🔄 Ideal para cachés y datos derivados
- ❌ NO usar para datos importantes

**Casos de uso:**
- Resultados de cálculos temporales
- Cachés de consultas
- Flags temporales
- Datos que se pueden recalcular

#### 📊 Comparación de Storage Types

| Tipo | Gas | Duración | TTL | Uso ideal |
|------|-----|----------|-----|-----------|
| Instance 📦 | Bajo | Media | Manual | Config del contrato |
| Persistent 💎 | Alto | Larga | Manual | Datos de usuarios |
| Temporary ⚡ | Muy bajo | Corta | Automático | Cachés |


### 4. **Symbol vs String en Soroban**

#### Symbol
- **Uso:** Identificadores cortos, nombres de usuario, tokens
- **Límite:** 32 caracteres máximo
- **Caracteres:** Solo ASCII (letras, números, guiones bajos)
- **Gas:** Más eficiente (~100 unidades)
- **Unicode:** ❌ No soporta emojis ni acentos

#### String
- **Uso:** Texto libre, descripciones, mensajes
- **Límite:** Sin límite práctico
- **Caracteres:** Soporta Unicode completo
- **Gas:** Más costoso (~150-200 unidades)
- **Unicode:** ✅ Soporta emojis y acentos

**En este proyecto:** Usamos `String` para permitir nombres con mayor flexibilidad.

### 5. **DataKey y Storage**

```rust
#[contracttype]
pub enum DataKey {
    Admin,                      // Valor único global
    ContadorSaludos,           // Contador global
    UltimoSaludo(Address),     // Valor por cada usuario (clave compuesta)
}
```

- **Instance Storage:** Datos de vida corta, vinculados a la instancia del contrato
- **Persistent Storage:** Datos de larga duración, ideales para información de usuarios

### 6. **Manejo de Errores**

```rust
pub enum Error {
    NombreVacio = 1,
    NombreMuyLargo = 2,
    NoAutorizado = 3,
    NoInicializado = 4,
}
```

**¿Por qué `Result<(), Error>`?**
- Permite detectar y comunicar errores explícitamente
- Revierte la transacción automáticamente si hay un error
- Hace el contrato más seguro y predecible
- Es estándar en Rust y crítico en smart contracts

### 7. **TTL (Time To Live)**

```rust
env.storage().instance().extend_ttl(100, 100);
```

El TTL controla cuánto tiempo permanecen los datos en el storage antes de ser archivados:
- **Primer parámetro:** Ledgers hasta que se pueda extender
- **Segundo parámetro:** Ledgers totales de vida

---

## 🔨 Compilación y Deploy

### 1. Compilar a WebAssembly
```bash
# Compilación básica
cargo build --target wasm32-unknown-unknown --release

# O usar Soroban CLI
soroban contract build
```

### 2. Optimizar el WASM
```bash
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/hello_tiburona.wasm
```

Esto generará `hello_tiburona.optimized.wasm` (~14% más pequeño).

### 3. Deploy a Testnet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hello_tiburona.optimized.wasm \
  --network testnet \
  --source alice
```

---

## 🐛 Errores Comunes y Soluciones

### Error 1: `can't find crate for 'core'`
```
error[E0463]: can't find crate for `core`
= note: the `wasm32-unknown-unknown` target may not be installed
```

**Causa:** Falta el target de WebAssembly.

**Solución:**
```bash
rustup target add wasm32-unknown-unknown
```

---

### Error 2: `unresolved import 'soroban_sdk'`
```
error[E0432]: unresolved import `soroban_sdk`
```

**Causa:** Falta la dependencia de Soroban SDK en `Cargo.toml`.

**Solución:**
Agregar en `Cargo.toml`:
```toml
[dependencies]
soroban-sdk = "23.0.3"

[dev-dependencies]
soroban-sdk = { version = "23.0.3", features = ["testutils"] }
```

---

### Error 3: `no method named 'to_string' found`
```
error[E0599]: no method named `to_string` found for struct `soroban_sdk::Symbol`
```

**Causa:** El método `to_string()` fue removido en versiones modernas del SDK.

**Solución para Symbol:**
```rust
// ❌ No funciona
let nombre_str = nombre.to_string();
if nombre_str.len() == 0 { ... }

// ✅ Cambiar a String
nombre: String

// Y validar directamente
if nombre.len() == 0 { ... }
```

---


## 🔧 Funciones 

### `hello(usuario: Address, nombre: String)`
Registra un saludo de un usuario.
- Valida que el nombre no esté vacío
- Valida que no supere 32 caracteres
- Incrementa contador global
- Guarda el último saludo del usuario
- Retorna el símbolo "Hola"

### `get_contador()`
Retorna el número total de saludos realizados.

### `get_ultimo_saludo(usuario: Address)`
Retorna el último nombre usado por un usuario (o `None` si nunca saludó).

### `reset_contador(caller: Address)`
Resetea el contador global a 0.
- Solo el admin puede llamar esta función

---

## 🧪 Tests

### Ejecutar todos los tests
```bash
cargo test
```

### Tests incluidos:
- ✅ Inicialización correcta
- ✅ Prevención de doble inicialización
- ✅ Saludo exitoso
- ✅ Validación de nombre vacío
- ✅ Reset solo por admin
- ✅ Usuario no autorizado no puede resetear

---

## 📊 Tamaños de archivo

```
Original WASM:     2.5 KB
Optimizado WASM:   2.2 KB
Reducción:         ~14%
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 🔗 Recursos Útiles

- [Documentación oficial de Soroban](https://soroban.stellar.org/docs)
- [Soroban CLI Docs](https://docs.claude.com/en/docs/claude-code)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Stellar Developer Discord](https://discord.gg/stellar)

---

## 👤 Autor

**BuenDia-Builders + Araceli**
- GitHub:
- [@BuenDia-Builders] https://github.com/BuenDia-Builders
- [@AraceliSantamaria](https://github.com/aracelisantamaria)

---

## 🙏 Agradecimientos

- BuenDia-Builders (Tati y Lisa)
- Stellar Foundation por Soroban
- Comunidad de Rust

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
