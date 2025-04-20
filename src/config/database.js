import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

mongoose.set('strictQuery', true)

export const connectDB = async () => {
    try {
        const uri = process.env.NODE_ENV === 'test' 
            ? process.env.MONGODB_URI_TEST
            : process.env.MONGODB_URI_PRODUCTION
        
        await mongoose.connect(uri)
        console.log(`Conexión exitosa a MongoDB (${process.env.NODE_ENV})`)
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error)
        process.exit(1)
    }
}

export const disconnectDB = async () => {
    await mongoose.disconnect()
    console.log('MongoDB desconectada')
}

export default connectDB
