import mongoose from "mongoose";

mongoose.set('strictQuery', true);

const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI_PRODUCTION);
        console.log(`Conexión exitosa a MongoDB Atlas`);
    } catch (error) {
        console.log("Error al conectar a MongoDB: ", error);
    }
};

export default connection;
