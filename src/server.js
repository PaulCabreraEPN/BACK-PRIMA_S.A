// Requerir los módulos
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import adminRoutes from './routers/admin_routes.js'
import productRoutes from './routers/products_routes.js'
import clientsRoutes from './routers/clients_routes.js'
import orderRoutes from './routers/order_routes.js'
import staticsRoutes from './routers/statics_routes.js'
import authRoutes from './routers/auth_routes.js'
import swaggerUI from 'swagger-ui-express'
import specs from '../swagger/swagger.js';
import { errorHandler } from './middlewares/errorhandler.js';

// Inicializaciones
const app = express();
dotenv.config();

// Configuraciones 
app.set('port',process.env.PORT || 3000);
app.use(cors());

// Middlewares 
app.use(express.json());


// Variables globales


// Rutas 
app.get('/',(req,res)=>{
    res.send("Server on 👨‍💻✅");
});

app.use('/api/',adminRoutes)
app.use('/api/',productRoutes)
app.use('/api/',clientsRoutes)
app.use('/api/',orderRoutes)
app.use('/api/',staticsRoutes)
app.use('/api/',authRoutes)
app.use('/api-docs',swaggerUI.serve,swaggerUI.setup(specs))


//Rutas no encontradas

app.use((req,res)=>res.status(404).send("EndPoint no encontrado - 404"))

app.use(errorHandler)
// Exportar la instancia de express por medio de app
export default  app;