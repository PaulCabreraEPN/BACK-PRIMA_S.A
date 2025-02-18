# Guía de Configuración

## Índice
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Email](#email)
- [JWT](#jwt)
- [Entornos](#entornos)

## Variables de Entorno

### Archivo .env
```plaintext
# Puerto del servidor
PORT = 3000

# Base de datos
MONGODB_URI_PRODUCTION = mongodb://[username:password@]host[:port]/database

# SMTP de Gmail
HOST_MAILTRAP = smtp.gmail.com
PORT_MAILTRAP = puerto Correo
USER_MAILTRAP = tu-correo@gmail.com
PASS_MAILTRAP = tu-contraseña-app-gmail
URL_BACK = http://localhost:3000
ADMIN_MAILTRAP = email-admin

# JWT
JWT_SECRET = tu-clave-secreta-jwt
```

### Configuración por Entorno

#### Desarrollo
```plaintext
PORT = 3000
MONGODB_URI_PRODUCTION = mongodb://localhost:27017/prima-dev
```

#### Pruebas
```plaintext
PORT = 3001
MONGODB_URI_PRODUCTION = mongodb://localhost:27017/prima-test
```

#### Producción
```plaintext
PORT = 80
MONGODB_URI_PRODUCTION = mongodb+srv://...
```

## Base de Datos

### Conexión MongoDB
Archivo: `src/config/database.js`
```javascript
mongoose.connect(process.env.MONGODB_URI_PRODUCTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
```

### Índices Recomendados
```javascript
// Vendedores
db.sellers.createIndex({ "email": 1 }, { unique: true })
db.sellers.createIndex({ "numberID": 1 }, { unique: true })
db.sellers.createIndex({ "username": 1 }, { unique: true })

// Productos
db.products.createIndex({ "id": 1 }, { unique: true })
db.products.createIndex({ "product_name": "text" })

// Órdenes
db.orders.createIndex({ "customer": 1 })
db.orders.createIndex({ "seller": 1 })
db.orders.createIndex({ "status": 1 })
```

## Email

### Configuración SMTP Gmail
1. Habilitar autenticación de dos factores en Gmail
2. Generar contraseña de aplicación
3. Usar en variables de entorno

### Plantillas de Email
Ubicación: `src/config/nodemailer.js`
```javascript
const mailOptions = {
    from: process.env.USER_MAILTRAP,
    to: userMail,
    subject: 'Tu cuenta ha sido creada en PRIMA S.A.',
    html: `...`
};
```

## JWT

### Configuración
Archivo: `src/middlewares/JWT.js`
```javascript
const JWT_OPTIONS = {
    expiresIn: "8h",
    algorithm: "HS256"
};
```

### Middlewares de Autenticación
```javascript
const verificarAutenticacion = async (req, res, next) => {
    // Configuración del middleware
};
```

## Entornos

### Desarrollo
```bash
# Iniciar en desarrollo
npm run dev

# Variables específicas
NODE_ENV=development
```

### Pruebas
```bash
# Ejecutar pruebas
npm test

# Variables específicas
NODE_ENV=test
```

### Producción
```bash
# Construir para producción
npm run build

# Variables específicas
NODE_ENV=production
```

## Scripts Disponibles

### package.json
```json
{
  "scripts": {
    "test": "vitest",
    "start": "nodemon src/index.js",
    "dev": "node --watch src/index.js"
  }
}
```


## Verificación de Configuración

### Lista de Verificación
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Servicio de email funcionando
- [ ] JWT configurado
- [ ] Seguridad implementada
- [ ] Logging configurado
