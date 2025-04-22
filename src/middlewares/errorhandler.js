export const errorHandler = (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido (5 MB).' });
    } else if (err.message.includes('Solo se permiten imágenes')) {
        return res.status(400).json({ error: err.message });
    }
    // Otros errores generales
    return res.status(500).json({ error: 'Error del servidor.' });
};

export const imageRequired = (req, res, next) => {
    if (!req.file) {
        // Si multer no adjuntó un archivo, envía una respuesta 400
        return res.status(400).json({ message: 'El archivo de imagen es obligatorio' });
    }
    // Si el archivo existe, continúa con el siguiente middleware
    next();
};