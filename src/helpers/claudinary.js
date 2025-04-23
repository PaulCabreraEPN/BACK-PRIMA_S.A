import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (imageBuffer) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'image' },
                (error, result) => {
                    if (error) {
                        console.error('Error al subir la imagen a Cloudinary:', error);
                        return reject(error);
                    }
                    return resolve(result);
                }
            );
            uploadStream.end(imageBuffer);
        });
    } catch (error) {
        //console.error('Error al procesar la imagen:', error);
        throw error;
    }
}

export const deleteImage = async (imageUrl) => {
    try {
        // Extraer el public_id de la URL de Cloudinary
        if (!imageUrl || imageUrl === '') return;

        // La URL tiene este formato: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[extension]
        const urlParts = imageUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicIdParts = publicIdWithExtension.split('.');
        const publicId = publicIdParts[0]; // Obtener el ID sin la extensión

        // Eliminar la imagen de Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        //console.error('Error al eliminar la imagen de Cloudinary:', error);
        throw error;
    }
}
