# BACK-PRIMA

**BACK-PRIMA** es un proyecto backend desarrollado con Node.js y Express, diseñado para ofrecer una API RESTful que puede integrarse con aplicaciones frontend. Utiliza MongoDB como base de datos y está preparado para entornos de desarrollo y producción.

## 📌 **Características**

- Conexión a la base de datos MongoDB Atlas.
- Gestión de rutas y middleware con Express.
- Soporte para CORS, permitiendo integraciones seguras desde diferentes orígenes.
- Validación de datos con `express-validator`.
- Autenticación y autorización mediante JSON Web Tokens (JWT).
- Cifrado de contraseñas con `bcryptjs`.
- Almacenamiento de archivos en Cloudinary.

## 🛠️ **Tecnologías Utilizadas**

- **Backend**: Node.js, Express.
- **Base de datos**: MongoDB (a través de Mongoose).
- **Autenticación**: JSON Web Tokens (JWT), bcryptjs.
- **Validación**: express-validator.
- **Otras herramientas**: dotenv, cors, Cloudinary.

---

## 🚀 **Instalación**

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu_usuario/back-prima.git
```

### 2. Navegar al directorio del proyecto
```bash
cd back-prima
```

### 3. Instalar las dependencias
```bash
npm install
```

### 4. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto y añade las siguientes configuraciones:
```plaintext
# MongoDB
MONGODB_URI_PRODUCTION=tu_uri_de_mongodb

# Configuración del servidor
PORT=3000

# JWT
JWT_SECRET=tu_clave_secreta

# Cloudinary
CLOUDINARY_NAME=tu_nombre_de_cloudinary
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## 💻 **Uso**

### **Iniciar el servidor**

#### Modo desarrollo (con nodemon):
```bash
npm run dev
```

#### Modo producción:
```bash
npm start
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000) o en el puerto especificado en tu archivo `.env`.

---

## 📚 **Rutas**

### **Rutas principales**
- **GET /**: Devuelve un mensaje de prueba: `"Server on"`.

> **Nota:** Para información más detallada sobre las rutas disponibles, consulta la documentación de la API (en desarrollo).

---

## 🛡️ **Seguridad**

Este proyecto utiliza las siguientes medidas de seguridad:
- Cifrado de contraseñas con `bcryptjs`.
- Generación y validación de tokens JWT para autenticar usuarios.
- Validación de entradas con `express-validator` para prevenir ataques de inyección.

---

## 🗃️ **Estructura del Proyecto**

```plaintext
back-prima/
│
├── src/
│   ├── config/         # Configuración (e.g., base de datos)
│   ├── controllers/    # Lógica de negocio para las rutas
│   ├── middlewares/    # Middlewares personalizados
│   ├── models/         # Definición de esquemas de MongoDB
│   ├── routes/         # Rutas de la API
│   ├── services/       # Servicios reutilizables (e.g., Cloudinary)
│   └── utils/          # Utilidades generales
│
├── app.js              # Punto de entrada del servidor
└── package.json        # Configuración del proyecto
```
## ✍️ **Autores**  

- **Paúl Sebastián Cabrera Cruz**  
- **Mathías Agustín Terán Alcívar**  
- **Ariel David Catucuamba Díaz**
