# Guía de Instalación

## Índice
- [Requisitos Previos](#requisitos-previos)
- [Instalación del Proyecto](#instalación-del-proyecto)
- [Verificación de la Instalación](#verificación-de-la-instalación)
- [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

### Software Necesario
1. **Node.js**
   - Versión: >= 14.x
   - [Descargar Node.js](https://nodejs.org/)
   - Verificar instalación:
     ```bash
     node --version
     npm --version
     ```

2. **MongoDB**
   - Versión: >= 4.4
   - [Descargar MongoDB](https://www.mongodb.com/try/download/community)
   - Verificar instalación:
     ```bash
     mongod --version
     ```

3. **Git**
   - [Descargar Git](https://git-scm.com/downloads)
   - Verificar instalación:
     ```bash
     git --version
     ```

### Herramientas Recomendadas
- Visual Studio Code
- MongoDB Compass (GUI para MongoDB)
- Postman o Thunder Client

## Instalación del Proyecto

### 1. Clonar el Repositorio
```bash
# Usando HTTPS
git clone https://github.com/tu-usuario/prima-sa-back.git

# O usando SSH
git clone git@github.com:tu-usuario/prima-sa-back.git

# Entrar al directorio
cd prima-sa-back
```

### 2. Instalar Dependencias
```bash
# Instalar todas las dependencias
npm install

# O usando la versión más corta
npm i
```

### 3. Preparar el Entorno
```bash
# Copiar el archivo de variables de entorno
cp .env.example .env

# Abrir en VS Code para editar
code .env
```

## Verificación de la Instalación

### 1. Verificar la Base de Datos
```bash
# Iniciar MongoDB (si no está como servicio)
mongod

# En otra terminal, verificar conexión
mongosh
```

### 2. Verificar el Servidor
```bash
# Iniciar en modo desarrollo
npm run dev

# Deberías ver:
# Server ok on http://localhost:3000
# Conexión exitosa a MongoDB Atlas
```

### 3. Probar los Endpoints
```bash
# Usando curl
curl http://localhost:3000/

# Deberías recibir:
# "Server on 👨‍💻✅"
```

## Solución de Problemas

### Errores Comunes

1. **Error: EADDRINUSE**
   - Puerto 3000 en uso
   - Solución: Cambiar puerto en .env o cerrar la aplicación que usa el puerto

2. **Error de Conexión MongoDB**
   - Verificar que MongoDB está corriendo
   - Verificar URI en .env
   - Verificar firewall/permisos

3. **Error: Cannot find module**
   - Ejecutar `npm install` nuevamente
   - Verificar que node_modules existe
   - Verificar package.json

### Comandos de Diagnóstico
```bash
# Verificar dependencias
npm list

# Verificar scripts disponibles
npm run

# Verificar estado de MongoDB
sudo systemctl status mongodb

# Limpiar instalación
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

### Recursos Adicionales
- [Documentación de Node.js](https://nodejs.org/docs)
- [Documentación de MongoDB](https://docs.mongodb.com)
- [Documentación de Express](https://expressjs.com)
