import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Extraer el primer error para el mensaje principal
        const firstError = errors.array()[0];
        const field = firstError.path; // Usar 'path' en lugar de 'param' para más precisión
        const message = firstError.msg;

        return res.status(400).json({
            status: "error",
            code: "VALIDATION_ERROR", // Código genérico para error de validación
            msg: `Error de validación en el campo '${field}': ${message}`, // Mensaje más descriptivo
            info: { // Detalles adicionales con todos los errores
                validationErrors: errors.array().map(error => ({
                    field: error.path, // Usar 'path'
                    message: error.msg
                }))
            }
        });
    }
    next();
};

