import {body, param} from 'express-validator';

// Utilidades de validación
const validateEcuadorianID = (id) => {
    if (!/^\d{10}$/.test(id)) return false;
    
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const province = parseInt(id.substring(0, 2));
    
    if (province < 1 || province > 24) return false;
    
    const lastDigit = parseInt(id.charAt(9));
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        let value = parseInt(id.charAt(i)) * coefficients[i];
        if (value > 9) value -= 9;
        sum += value;
    }
    
    const total = (Math.ceil(sum / 10) * 10) - sum;
    return (total === 10 ? 0 : total) === lastDigit;
};

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

const validateEcuadorianPhone = (phone) => {
    // Convertir a string y limpiar el número
    const phoneString = phone.toString().trim().replace(/\s+/g, '');
    
    // Normalizar el número a formato local
    let normalizedPhone = phoneString;
    
    // Si empieza con +593, remover el +
    if (phoneString.startsWith('+593')) {
        normalizedPhone = '593' + phoneString.slice(4);
    }
    // Si empieza con 0, reemplazar con 593
    else if (phoneString.startsWith('0')) {
        normalizedPhone = '593' + phoneString.slice(1);
    }

    // Expresión regular actualizada para números ecuatorianos
    const phoneRegex = /^593(9\d{8}|[2-7]\d{7})$/;

    const isValid = phoneRegex.test(normalizedPhone);
    
    return isValid;
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
        .isLength({ min: 3, max: 50 }).withMessage('Los nombres deben tener entre 3 y 50 caracteres')
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
        .isLength({ min: 3, max: 50 }).withMessage('Los apellidos deben tener entre 3 y 50 caracteres')
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
    
    body('numberID')
        .notEmpty().withMessage('La cédula es requerida')
        .custom((value) => {
            const id = value.toString();
            if (!validateEcuadorianID(id)) {
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
        .notEmpty().withMessage('El teléfono es requerido')
        .custom((value) => {
            const phone = value.toString();  // Convierte el número a cadena
            if (!validateEcuadorianPhone(phone)) {
                throw new Error('Número de teléfono ecuatoriano inválido');
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
        .custom((value) => {
            const phone = value.toString();  // Convierte el número a cadena
            if (!validateEcuadorianPhone(phone)) {
                throw new Error('Número de teléfono ecuatoriano inválido');
            }
            return true;
        }),
    
    body('SalesCity')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Ciudad inválida'),
    
    body('status')
        .optional()
        .isBoolean().withMessage('Estado debe ser un valor booleano')
];

// Validaciones para la actualización completa del vendedor
const validateUpdateAllSeller = [
    param('id')
        .isMongoId().withMessage('ID de vendedor inválido'),
    
    // Nombres - Requerido y validación estricta
    body('names')
        .trim()
        .notEmpty().withMessage('Los nombres son requeridos')
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
    
    // Apellidos - Requerido y validación estricta
    body('lastNames')
        .trim()
        .notEmpty().withMessage('Los apellidos son requeridos')
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

    // Email - Requerido y validación de formato
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),

    // Número de teléfono - Requerido y validación de formato ecuatoriano
    body('PhoneNumber')
        .notEmpty().withMessage('El teléfono es requerido')
        .custom((value) => {
            const phone = value.toString();  // Convierte el número a cadena
            if (!validateEcuadorianPhone(phone)) {
                throw new Error('Número de teléfono ecuatoriano inválido');
            }
            return true;
        }),

    // Ciudad de ventas - Requerido y validación de formato
    body('SalesCity')
        .trim()
        .notEmpty().withMessage('La ciudad de ventas es requerida')
        .isLength({ min: 3, max: 50 }).withMessage('Ciudad inválida')
        .matches(/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/).withMessage('La ciudad solo puede contener letras')
        .custom(value => {
            // Lista de ciudades principales de Ecuador
            const mainCities = ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Ambato', 'Loja', 'Machala', 'Portoviejo', 'Ibarra', 'Riobamba'];
            const cityNormalized = value.trim().toLowerCase();
            return mainCities.some(city => city.toLowerCase() === cityNormalized);
        }).withMessage('Debe ser una ciudad principal de Ecuador'),

    // Rol - Requerido y validación de valores permitidos
    body('role')
        .trim()
        .notEmpty().withMessage('El rol es requerido')
        .isIn(['Seller']).withMessage('Rol inválido'),

    // Estado - Requerido y booleano
    body('status')
        .notEmpty().withMessage('El estado es requerido')
        .isBoolean().withMessage('El estado debe ser verdadero o falso'),

    // Número de identificación - Requerido y validación de cédula ecuatoriana
    body('numberID')
        .notEmpty().withMessage('El número de identificación es requerido')
        .custom((value) => {
            const id = value.toString();
            if (!validateEcuadorianID(id)) {
                throw new Error('Cédula ecuatoriana inválida');
            }
            return true;
        })
];

// Validaciones para búsqueda por ID
const validateFindSellerById = [
    param('id')
        .isMongoId().withMessage('ID de vendedor inválido')
];

// Validaciones para búsqueda por cédula
const validateFindSellerByNumberId = [
    param('numberID')
        .custom((value) => {
            const id = value.toString();
            if (!validateEcuadorianID(id)) {
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
    validateUpdateAllSeller,
    validateEcuadorianID
}

