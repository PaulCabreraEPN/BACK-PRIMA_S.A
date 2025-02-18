# Guía de Despliegue

## Índice
- [Preparación](#preparación)
- [Despliegue en Producción](#despliegue-en-producción)
- [Configuración del Servidor](#configuración-del-servidor)
- [Monitoreo](#monitoreo)
- [Mantenimiento](#mantenimiento)

## Preparación

### 1. Verificación Pre-Despliegue
```bash
# Ejecutar todas las pruebas
npm test

# Verificar dependencias
npm audit

# Construir proyecto
npm run build
```

### 2. Lista de Verificación
- [ ] Todas las pruebas pasan
- [ ] No hay vulnerabilidades críticas
- [ ] Variables de entorno configuradas
- [ ] Documentación actualizada
- [ ] Base de datos respaldada

### 3. Versionamiento
```bash
# Actualizar versión
npm version patch|minor|major

# Crear tag
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## Despliegue en Producción

### 1. Render (Plataforma Actual)

#### Configuración en Render
1. Crear nuevo Web Service
2. Conectar con repositorio
3. Configurar variables de entorno:
   ```plaintext
   NODE_ENV=production
   PORT=3000
   MONGODB_URI_PRODUCTION=mongodb+srv://...
   JWT_SECRET=...
   ```
4. Configurar comando de inicio:
   ```bash
   npm install && npm start
   ```

#### Despliegue Manual
```bash
# Desplegar a Render
git push render main
```

### 2. Servidor Propio (Alternativa)

#### Requisitos del Servidor
- Ubuntu 20.04 LTS o superior
- Node.js 14.x o superior
- MongoDB 4.4 o superior
- Nginx
- PM2

#### Instalación de Dependencias
```bash
# Actualizar sistema
sudo apt update
sudo apt upgrade

# Instalar Node.js
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MongoDB
sudo apt install -y mongodb

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2
```

#### Despliegue
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/prima-sa-back.git
cd prima-sa-back

# Instalar dependencias
npm install --production

# Configurar PM2
pm2 start src/index.js --name "prima-backend"
pm2 startup
pm2 save
```

## Configuración del Servidor

### Nginx
```nginx
server {
    listen 80;
    server_name api.prima-sa.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d api.prima-sa.com
```

### Firewall
```bash
# Configurar UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Monitoreo

### PM2
```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs

# Monitoreo en tiempo real
pm2 monit
```

### Logs
```bash
# Configurar Winston
npm install winston

# Ver logs
tail -f logs/error.log
tail -f logs/combined.log
```

### Métricas
- Implementar endpoint de health check
- Configurar monitoreo con New Relic o similar
- Configurar alertas

## Mantenimiento

### Backups
```bash
# Backup de MongoDB
mongodump --uri="mongodb://localhost:27017/prima" --out=/backup/$(date +%Y%m%d)

# Backup automatizado
0 0 * * * mongodump --uri="mongodb://localhost:27017/prima" --out=/backup/$(date +%Y%m%d)
```

### Actualizaciones
```bash
# Actualizar dependencias
npm update

# Actualizar sistema
sudo apt update
sudo apt upgrade
```

### Rollback
```bash
# Revertir a versión anterior
git checkout v1.0.0
npm install
pm2 restart prima-backend
```
