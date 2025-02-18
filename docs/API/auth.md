# Guía de Autenticación

## Índice
- [Descripción General](#descripción-general)
- [Flujos de Autenticación](#flujos-de-autenticación)
- [Tokens JWT](#tokens-jwt)
- [Rutas Protegidas](#rutas-protegidas)
- [Ejemplos](#ejemplos)
- [Mejores Prácticas](#mejores-prácticas)

## Descripción General
PRIMA S.A. utiliza JWT (JSON Web Tokens) para la autenticación de usuarios. Existen dos tipos de usuarios en el sistema:
- Administradores
- Vendedores

## Flujos de Autenticación

### Administradores
1. **Login**
   ```javascript
   POST /api/login-admin
   {
       "username": "admin2024",
       "password": "Admin123*"
   }
   ```
   - 3 intentos máximos
   - Bloqueo manual requerido después de intentos fallidos
   - No requiere confirmación de email

2. **Recuperación de Contraseña**
   ```javascript
   POST /api/recovery-password-admin
   {
       "username": "admin2024"
   }
   ```
   - Nueva contraseña generada automáticamente
   - Enviada al email corporativo

### Vendedores
1. **Login**
   ```javascript
   POST /api/login
   {
       "username": "vendedor123",
       "password": "Pass123*"
   }
   ```
   - Requiere confirmación previa de email
   - No tiene límite de intentos

2. **Registro** (solo por administradores)
   ```javascript
   POST /api/register
   {
       "names": "Juan Carlos",
       "lastNames": "Pérez García",
       "numberID": "1234567890",
       "email": "juan.perez@prima-sa.com",
       "SalesCity": "Quito",
       "PhoneNumber": "0987654321"
   }
   ```
   - Credenciales enviadas por email
   - Requiere confirmación de email

3. **Confirmación de Email**
   ```
   GET /api/confirm-account/:token
   ```

## Tokens JWT

### Estructura
```javascript
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "id": "user_id",
        "rol": "admin|Seller",
        "exp": 1234567890
    }
}
```

### Uso
```javascript
// Headers en peticiones
{
    'Authorization': 'Bearer eyJhbGciOiJIUzI1...'
}
```

### Expiración
- Tokens válidos por 8 horas
- Se requiere relogin después de expiración
- No hay refresh token

## Rutas Protegidas

### Verificación de Token
Todas las rutas protegidas usan el middleware `verificarAutenticacion`:

```javascript
// Ejemplo de ruta protegida
router.get('/protected-route', 
    verificarAutenticacion, 
    controller.method
);
```

### Roles y Permisos
- Administradores: Acceso total
- Vendedores: Acceso limitado a sus recursos

## Ejemplos

### Login de Administrador
```javascript
const loginAdmin = async (username, password) => {
    try {
        const response = await fetch('/api/login-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Guardar token
            localStorage.setItem('token', data.tokenJWT);
            return data;
        } else {
            throw new Error(data.msg);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
```

### Verificación de Token
```javascript
const verifyToken = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            // Redirigir a login
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
```

## Mejores Prácticas

### Seguridad
1. Nunca almacenar contraseñas en texto plano
2. Usar HTTPS en producción
3. Validar inputs rigurosamente

### Manejo de Sesión
1. Verificar token en cada petición
2. Limpiar token al cerrar sesión
3. Manejar expiración adecuadamente
4. Implementar logout en todos los dispositivos

### Contraseñas
1. Mínimo 8 caracteres
2. Combinar mayúsculas, minúsculas, números
3. No permitir contraseñas comunes

### Registro
1. Validar emails corporativos
2. Confirmación obligatoria
3. Credenciales seguras por defecto
4. Logging de intentos fallidos