import { body, param } from 'express-validator';

// Validaciones para el login de administrador
const regex= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/
const regexUsername = /^[A-Za-z0-9@#$%&*()_\-]+$/;
export const validateAdminLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es requerido')
        .matches(regexUsername)
        .withMessage('Formato de usuario inválido'),
    body('password')
        .trim()
        .notEmpty().withMessage('La contraseña es requerida')
        .matches(/^[A-Z0-9]{8}$/)
        .withMessage('Formato de contraseña inválido: la contraseña debe tener 8 caracteres y contener al menos una mayúscula, una minúscula y un número')
];


// Validaciones para recuperación de contraseña de administrador
export const validateAdminPasswordRecovery = [
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es requerido')
        .matches(regex).withMessage('El usuario solo puede contener letras')
];

// Validaciones para el login de vendedor
export const validateSellerLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es requerido')
        // Validación más flexible para usernames generados
        .matches(regex)
        .withMessage('Formato de usuario inválido'),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        // Validación más flexible para contraseñas generadas
        .matches(regex)
        .withMessage('Formato de contraseña inválido')
];

// Validaciones para solicitud de recuperación de contraseña de vendedor
export const validateSellerPasswordRecoveryRequest = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail()
];

// Validaciones para el token de recuperación de contraseña
export const validatePasswordRecoveryToken = [
    param('token')
        .trim()
        .notEmpty().withMessage('El token es requerido')
        .isLength({ min: 10 }).withMessage('Token inválido')
];

// Validaciones para establecer nueva contraseña
export const validateNewPassword = [
    param('token')
        .trim()
        .notEmpty().withMessage('El token es requerido')
        .isLength({ min: 10 }).withMessage('Token inválido'),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(regex)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
    
    body('confirmpassword')
        .notEmpty().withMessage('La confirmación de contraseña es requerida')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        })
];