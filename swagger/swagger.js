// swagger/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import dotenv from 'dotenv';

dotenv.config();

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API PRIMA S.A",
            version: "1.0.0",
            description: `
API RESTful para la gestión empresarial de PRIMA S.A.

Esta API proporciona endpoints para:
- Gestión de vendedores
- Administración de productos
- Manejo de clientes
- Procesamiento de órdenes
- Autenticación y autorización
- Estadísticas y reportes

Para usar esta API, asegúrese de incluir el token JWT en el header de Authorization:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`
            `,
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: "Servidor de Desarrollo"
            },
            {
                url: "https://back-prima-s-a.onrender.com",
                description: "Servidor de Producción"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
        tags: [
            {
                name: "Autenticación",
                description: "Endpoints para autenticación de usuarios"
            },
            {
                name: "Administradores",
                description: "Gestión de administradores del sistema"
            },
            {
                name: "Vendedores",
                description: "Gestión de vendedores"
            },
            {
                name: "Clientes",
                description: "Gestión de clientes"
            },
            {
                name: "Productos",
                description: "Gestión de productos"
            },
            {
                name: "Órdenes",
                description: "Gestión de órdenes y pedidos"
            },
            {
                name: "Estadísticas",
                description: "Endpoints para reportes y estadísticas"
            }
        ]
    },
    apis: ["./swagger/*.yml"]
};

const specs = swaggerJSDoc(options);
export default specs;