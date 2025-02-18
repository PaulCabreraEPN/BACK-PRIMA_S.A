# Manual Técnico para Desarrolladores

## Entorno de Desarrollo

### Requisitos Previos
- Node.js >= 14.x
- MongoDB >= 4.4
- Git
- IDE recomendado: Visual Studio Code
- Postman (para pruebas de API)

### Extensiones Recomendadas VS Code
- ESLint
- Prettier
- GitLens
- MongoDB for VS Code
- Thunder Client

## Configuración del Proyecto

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/prima-sa-back.git
cd prima-sa-back
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:
```plaintext
PORT=3000
MONGODB_URI_PRODUCTION=mongodb://...
JWT_SECRET=your-secret-key
```

### 4. Iniciar el Servidor
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## Estructura del Código

### Convenciones de Nombrado
- Archivos: camelCase
- Clases: PascalCase
- Variables y funciones: camelCase
- Constantes: UPPER_SNAKE_CASE

### Organización de Carpetas
```
src/
├── config/         # Configuraciones
├── controllers/    # Lógica de negocio
├── middlewares/    # Middlewares
├── models/         # Modelos de datos
├── routes/         # Rutas
├── validators/     # Validaciones
└── helpers/        # Utilidades
```

