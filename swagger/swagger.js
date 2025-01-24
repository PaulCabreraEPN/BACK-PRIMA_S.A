import swaggerJSDoc from "swagger-jsdoc"
import dotenv from 'dotenv'


dotenv.config();

let port = process.env.PORT || 3000;

const options={
    definition:{
        openapi: "3.0.0",
        info:{
            title:"API PRIMA S.A",
            version:"1.0.0",
            description:"API para la gestión de productos, clientes y ordenes de la empresa PRIMA S.A",
            contact:{
                name:"Developer"
            },
            servers:[
                {
                    url:`http://localhost:${port}`,
                    description:"Development server"
                },
                {
                    url:"https://back-prima-s-a.onrender.com",
                    description:"Production server"
                }
            ]
        }
    },
    apis:["./swagger/*.yml"]
}

const specs = swaggerJSDoc(options);
export default specs;