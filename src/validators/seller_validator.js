import {body, param} from 'express-validator';
import validator from 'ecuador-validator'

// Utilidades de validación

const validateTwoNames = (names) => {
    // Eliminar espacios extras y dividir por espacios
    const nameArray = names.trim().replace(/\s+/g, ' ').split(' ');
    return nameArray.length === 2;
};

const validateTwoLastNames = (lastNames) => {
    // Eliminar espacios extras y dividir por espacios
    const lastNameArray = lastNames.trim().replace(/\s+/g, ' ').split(' ');
    return lastNameArray.length === 2;
};


// Actualizar la expresión regular para permitir espacios
const nameRegex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;

// Expresión regular para validar nombres/apellidos individuales
const singleNameRegex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ]+$/;

// Validaciones para la creación de vendedor
const validateCreateSeller = [
    body('names')
        .trim()
        .notEmpty().withMessage('Los nombres son requeridos')
        .isLength({ min: 3, max: 50 }).withMessage('Los nombres deben tener entre 3 y 50 carácteres')
        .matches(nameRegex).withMessage('Los nombres solo pueden contener letras')
        .custom((value) => {
            if (!validateTwoNames(value)) {
                throw new Error('Debe ingresar exactamente dos nombres');
            }
            // Validar que cada nombre cumpla con el formato
            const names = value.trim().split(/\s+/);
            for (const name of names) {
                if (!singleNameRegex.test(name)) {
                    throw new Error('Cada nombre debe contener solo letras');
                }
                if (name.length < 3) {
                    throw new Error('Cada nombre debe tener al menos 3 letras');
                }
                if (name.length > 20) {
                    throw new Error('Cada nombre no puede exceder 20 letras');
                }
            }
            return true;
        }),

    body('lastNames')
        .trim()
        .notEmpty().withMessage('Los apellidos son requeridos')
        .isLength({ min: 3, max: 50 }).withMessage('Los apellidos deben tener entre 3 y 50 carácteres')
        .matches(nameRegex).withMessage('Los apellidos solo pueden contener letras')
        .custom((value) => {
            if (!validateTwoLastNames(value)) {
                throw new Error('Debe ingresar exactamente dos apellidos');
            }
            
            // Validar que cada apellido cumpla con el formato
            const lastNames = value.trim().split(/\s+/);
            for (const lastName of lastNames) {
                if (!singleNameRegex.test(lastName)) {
                    throw new Error('Cada apellido debe contener solo letras');
                }
                if (lastName.length < 3) {
                    throw new Error('Cada apellido debe tener al menos 3 letras');
                }
                if (lastName.length > 20) {
                    throw new Error('Cada apellido no puede exceder 20 letras');
                }
            }
            return true;
        }),
    
    body('cedula')
        .trim()
        .notEmpty().withMessage('La cédula es requerida')
        .custom((value) => {
            if (!validator.ci(value)) {
                throw new Error('Cédula ecuatoriana inválida');
            }
            return true;
        }),
    
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('SalesCity')
        .trim()
        .notEmpty().withMessage('La ciudad de ventas es requerida')
        .isLength({ min: 3, max: 50 }).withMessage('Ciudad inválida'),
    
    body('PhoneNumber')
        .trim()
        .notEmpty().withMessage('El teléfono celular es requerido')
        .isNumeric().withMessage('El teléfono celular debe ser un número')
        .isLength({ min: 10, max: 10 }).withMessage('El teléfono debe tener exactamente 10 dígitos')
        .custom((value) => {
            const phone = value.toString();  // Convierte el número a cadena
            if (!validator.cellphone(phone)) {
                throw new Error('Número de teléfono celular inválido');
            }
            return true;
        }),
    
    body('role')
        .trim()
        .notEmpty().withMessage('El rol es requerido')
        .isIn(['Seller']).withMessage('Rol inválido')
];


// Validaciones para la actualización de vendedor
const validateUpdateSeller = [
    param('id')
        .isMongoId().withMessage('ID de vendedor inválido'),
    
    body('names')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Los nombres deben tener entre 3 y 50 caracteres')
        .matches(nameRegex).withMessage('Los nombres solo pueden contener letras')
        .custom((value) => {
            if (!validateTwoNames(value)) {
                throw new Error('Debe ingresar exactamente dos nombres');
            }
            
            const names = value.trim().split(/\s+/);
            for (const name of names) {
                if (!singleNameRegex.test(name)) {
                    throw new Error('Cada nombre debe contener solo letras');
                }
                if (name.length < 3) {
                    throw new Error('Cada nombre debe tener al menos 3 letras');
                }
                if (name.length > 20) {
                    throw new Error('Cada nombre no puede exceder 20 letras');
                }
            }
            return true;
        }),

    body('lastNames')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Los apellidos deben tener entre 3 y 50 caracteres')
        .matches(nameRegex).withMessage('Los apellidos solo pueden contener letras')
        .custom((value) => {
            if (!validateTwoLastNames(value)) {
                throw new Error('Debe ingresar exactamente dos apellidos');
            }
            
            const lastNames = value.trim().split(/\s+/);
            for (const lastName of lastNames) {
                if (!singleNameRegex.test(lastName)) {
                    throw new Error('Cada apellido debe contener solo letras');
                }
                if (lastName.length < 3) {
                    throw new Error('Cada apellido debe tener al menos 3 letras');
                }
                if (lastName.length > 20) {
                    throw new Error('Cada apellido no puede exceder 20 letras');
                }
            }
            return true;
        }),
    
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('PhoneNumber')
        .optional()
        .trim()
        .custom((value) => {
            const phone = value.toString();  // Convierte el número a cadena
            if (!validator.cellphone(phone)) {
                throw new Error('Número de teléfono celular inválido');
            }
            return true;
        }),
    
    body('SalesCity')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Ciudad inválida'),
    
    body('status')
        .optional()
        .trim()
        .isBoolean().withMessage('Estado debe ser un valor booleano')
];



// Validaciones para búsqueda por ID
const validateFindSellerById = [
    param('id')
        .trim()
        .isMongoId().withMessage('ID de vendedor inválido')
];

// Validaciones para búsqueda por cédula
const validateFindSellerByNumberId = [
    param('cedula')
        .custom((value) => {
            value = value.toString(); 
            if (!validator.ci(value)) {
                throw new Error('Cédula ecuatoriana inválida');
            }
            return true;
        })
];

export {
    validateCreateSeller,
    validateUpdateSeller,
    validateFindSellerById,
    validateFindSellerByNumberId,
}

