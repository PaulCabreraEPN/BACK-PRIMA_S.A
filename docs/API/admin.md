# API de Administradores

## Endpoints

### Login Administrador
```http
POST /api/login-admin
```

**Request Body:**
```json
{
    "username": "admin2024",
    "password": "Admin123*"
}
```

**Response Success (200):**
```json
{
    "msg": "Inicio de sesión exitoso",
    "inf": {
        "_id": "65f0e3b2c54a8c3b7c9d1234",
        "username": "admin2024",
        "role": "admin",
        "createdAt": "2024-03-12T15:30:00Z"
    },
    "tokenJWT": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error (400):**
```json
{
    "msg": "Lo sentimos, debes llenar todos los campos"
}
```

### Recuperación de Contraseña
```http
POST /api/recovery-password-admin
```

**Request Body:**
```json
{
    "username": "admin2024"
}
```

**Response Success (200):**
```json
{
    "msg": "Nueva Contraseña generada, REVISA EL CORREO DE LA EMPRESA"
}
```

## Modelo de Datos

### Esquema Admin
```javascript
{
    username: {
        type: String,
        require: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        require: true,
        trim: true
    },
    role: {
        type: String,
        require: true,
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    chances: {
        type: Number,
        require: true 
    },
    lastLogin: {
        type: Date,
        require: true, 
        trim: true,
        default: Date.now() 
    }
}
```

## Sistema de Intentos de Login

El sistema implementa un mecanismo de seguridad basado en intentos:

1. Cada administrador tiene 3 intentos de login (`chances`)
2. Los intentos se resetean con un login exitoso
3. Cuando `chances` llega a 0, la cuenta se bloquea (`status: false`)
4. Solo otro administrador puede desbloquear la cuenta

## Validaciones

### Username
- No puede estar vacío
- Debe ser único en el sistema
- Solo permite letras, números y caracteres especiales específicos (@#$%&*()_-)

### Password
- 8 caracteres exactos
- Solo letras mayúsculas y números
- Generada automáticamente en recuperación

## Seguridad

- Contraseñas encriptadas con bcrypt
- Token JWT para autenticación
- Rate limiting en endpoints de login
- Bloqueo de cuenta tras intentos fallidos
- Registro de último acceso

## Códigos de Estado HTTP

- 200: Operación exitosa
- 400: Error en datos de entrada
- 401: No autorizado
- 403: Prohibido
- 500: Error del servidor

## Ejemplos de Uso

### Login Exitoso
```javascript
fetch('/api/login-admin', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'admin2024',
        password: 'ADMIN123'
    })
})
```

### Recuperación de Contraseña
```javascript
fetch('/api/recovery-password-admin', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'admin2024'
    })
})
```

## Notas Importantes

1. La contraseña generada en recuperación:
   - Es temporal
   - Debe ser cambiada en el primer acceso
   - Solo contiene mayúsculas y números
   - Tiene exactamente 8 caracteres

2. Sistema de bloqueo:
   - La cuenta se bloquea automáticamente tras 3 intentos fallidos
   - Solo otro administrador puede desbloquear la cuenta
   - Los intentos se resetean tras un login exitoso

3. Seguridad:
   - Todas las operaciones son registradas
   - Se mantiene un historial de accesos
   - Las contraseñas nunca se envían en texto plano

4. Recomendaciones:
   - Cambiar contraseñas regularmente
   - No compartir credenciales
   - Cerrar sesión después de usar
   - Usar contraseñas fuertes