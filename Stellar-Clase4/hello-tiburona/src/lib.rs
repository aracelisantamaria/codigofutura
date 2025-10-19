#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype,
    Env, Symbol, Address, String  // ← Importar String
};

// Definir errores
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NombreVacio = 1,
    NombreMuyLargo = 2,
    NoAutorizado = 3,
    NoInicializado = 4,
}

// Definir DataKey
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ContadorSaludos,
    UltimoSaludo(Address),
}

// Definir el contrato
#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    // Funciones:
    // Firma de la función
        pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
            // Verificar si ya está inicializado
            if env.storage().instance().has(&DataKey::Admin) {
                return Err(Error::NoInicializado);
            }

            // Guardar el admin
            env.storage().instance().set(&DataKey::Admin, &admin);

            // Inicializar contador
            env.storage().instance().set(&DataKey::ContadorSaludos, &0u32);

            // Extender TTL
            env.storage().instance().extend_ttl(100, 100);
        
            Ok(())
        }
        
        pub fn hello(
            env: Env,
            usuario: Address,
            nombre: String  // ✅ Cambio de Symbol a String
        ) -> Result<Symbol, Error> {
            
            // Validación - Nombre no vacío
            //let nombre_str = nombre.to_string(); // ← Eliminar esta conversión -- String ya tiene .len(), no necesitamos .to_string()
            if nombre.len() == 0 {  // ← Cambiar de nombre_str a nombre porque ya es un Strig
                return Err(Error::NombreVacio);
            }

            // Validación - Nombre no muy largo
            if nombre.len() > 32 { // ← Cambiar de nombre_str a nombre porque ya es un Strig
                return Err(Error::NombreMuyLargo);
            }

            // Incrementar contador
            let key_contador = DataKey::ContadorSaludos;
            let contador: u32 = env.storage()
                .instance()
                .get(&key_contador)
                .unwrap_or(0);
        
            env.storage()
                .instance()
                .set(&key_contador, &(contador + 1));

            // Guardar último saludo
            env.storage()
                .persistent()
                .set(&DataKey::UltimoSaludo(usuario.clone()), &nombre);

            // Extender TTL
            env.storage()
                .persistent()
                .extend_ttl(&DataKey::UltimoSaludo(usuario), 100, 100);
        
            env.storage()
                .instance()
                .extend_ttl(100, 100);

            // Retornar saludo
            Ok(Symbol::new(&env, "Hola"))

        }
        
        // Implementar funciones de consulta
        // get_contador()
        pub fn get_contador(env: Env) -> u32 {
            env.storage()
                .instance()
                .get(&DataKey::ContadorSaludos)
                .unwrap_or(0)
        }
        
        // get_ultimo_saludo()
        pub fn get_ultimo_saludo(env: Env, usuario: Address) -> Option<Symbol> {
            env.storage()
                .persistent()
                .get(&DataKey::UltimoSaludo(usuario))
        }
        
        // Implementar función administrativa
        // reset_contador() - Estructura
        pub fn reset_contador(env: Env, caller: Address) -> Result<(), Error> {
            // Obtener admin y verificar
            let admin: Address = env.storage()
                .instance()
                .get(&DataKey::Admin)
                .ok_or(Error::NoInicializado)?;
            
            //Verificar permisos
            if caller != admin {
                return Err(Error::NoAutorizado);
            }
            
            // Resetear contador
            env.storage()
                .instance()
                .set(&DataKey::ContadorSaludos, &0u32);
            
            Ok(())
        }
    
}

// Tests comprehensivos

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        
        // Primera inicialización debe funcionar
        client.initialize(&admin);
        
        // Verificar contador en 0
        assert_eq!(client.get_contador(), 0);
    }

    // Test - No inicializar dos veces
        #[test]
    #[should_panic(expected = "NoInicializado")]
    fn test_no_reinicializar() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        
        client.initialize(&admin);
        client.initialize(&admin);  // Segunda vez debe fallar
    }

    // Test - Hello con validaciones
        #[test]
    fn test_hello_exitoso() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);
        
        client.initialize(&admin);
        
        let nombre = Symbol::new(&env, "Ana");
        let resultado = client.hello(&usuario, &nombre);
        
        assert_eq!(resultado, Symbol::new(&env, "Hola"));
        assert_eq!(client.get_contador(), 1);
        assert_eq!(client.get_ultimo_saludo(&usuario), Some(nombre));
    }

    // Test - Nombre vacío falla
        #[test]
    #[should_panic(expected = "NombreVacio")]
    fn test_nombre_vacio() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);
        
        client.initialize(&admin);
        
        let vacio = Symbol::new(&env, "");
        client.hello(&usuario, &vacio);  // Debe fallar
    }

    // Test - Reset solo admin
        #[test]
    fn test_reset_solo_admin() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let otro = Address::generate(&env);
        let usuario = Address::generate(&env);
        
        client.initialize(&admin);
        
        // Hacer saludos
        client.hello(&usuario, &Symbol::new(&env, "Test"));
        assert_eq!(client.get_contador(), 1);
        
        // Admin puede resetear
        client.reset_contador(&admin);
        assert_eq!(client.get_contador(), 0);
    }

    // Test - Usuario no admin no puede resetear
        #[test]
    #[should_panic(expected = "NoAutorizado")]
    fn test_reset_no_autorizado() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let otro = Address::generate(&env);
        
        client.initialize(&admin);
        
        // Otro usuario intenta resetear
        client.reset_contador(&otro);  // Debe fallar
    }

}