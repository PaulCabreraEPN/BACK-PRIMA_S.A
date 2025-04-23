export const errorHandler = (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            status: "error",
            code: "FILE_SIZE_LIMIT_EXCEEDED", // Código específico para tamaño de archivo
            msg: 'El archivo excede el tamaño máximo permitido (10 MB).'
        });
    } else if (err.message.includes('Solo se permiten imágenes')) {
        return res.status(400).json({
            status: "error",
            code: "INVALID_FILE_TYPE", // Código específico para tipo de archivo
            msg: err.message // Mantenemos el mensaje específico de la validación
        });
    }
    // Otros errores generales
    return res.status(500).json({
        status: "error",
        code: "SERVER_ERROR",
        msg: 'Ha ocurrido un error inesperado en el servidor. Intente de nuevo más tarde.'
        // No incluir err.message o err.stack aquí para evitar filtrar detalles sensibles
    });
};

export const imageRequired = (req, res, next) => {
    if (!req.file) {
        // Si multer no adjuntó un archivo, envía una respuesta 400
        return res.status(400).json({
            status: "error",
            code: "MISSING_FIELD", // Código para campo faltante
            msg: 'El archivo de imagen es obligatorio.' // Mensaje específico
        });
    }
    // Si el archivo existe, continúa con el siguiente middleware
    next();
};