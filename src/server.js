// Requerir los módulos
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import adminRoutes from './routers/admin_routes.js'
import productRoutes from './routers/products_routes.js'
import clientsRoutes from './routers/clients_routes.js'

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
    res.send("Server on");
});

app.use('/api/',adminRoutes)
app.use('/api/',productRoutes)
app.use('/api/',clientsRoutes)

//Rutas no encontradas

app.use((req,res)=>res.status(404).send("EndPoint no encontrado - 404"))

// Exportar la instancia de express por medio de app
export default  app;