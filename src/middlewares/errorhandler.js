export const errorHandler = (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido (5 MB).' });
    } else if (err.message.includes('Solo se permiten imágenes')) {
        return res.status(400).json({ error: err.message });
    }
    // Otros errores generales
    return res.status(500).json({ error: 'Error del servidor.' });
};
