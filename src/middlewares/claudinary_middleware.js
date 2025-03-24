import { uploadImage } from '../helpers/claudinary.js';

// Middleware para procesar la imagen y subirla a Cloudinary
const processImage = async (req, res, next) => {
    if (req.file) {
        try {
            const result = await uploadImage(req.file.buffer);
            req.imageUrl = result.secure_url;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Error al procesar la imagen' });
        }
    } else {
        next();
    }
};

export default processImage;