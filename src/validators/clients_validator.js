import {body,param} from 'express-validator'
import validator from 'ecuador-validator';

export const validateCreateClient = [
    body('Ruc')
        .notEmpty().withMessage('El RUC es obligatorio')
        .custom((value) => {
            if (!validator.ruc(value)) {
                throw new Error('El RUC no es válido');
            }
            return true;
        }),
    body('Name')
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener al menos 3 caracteres y máximo 50'),
    body('ComercialName')
        .notEmpty().withMessage('El nombre comercial es obligatorio')
        .isLength({ min: 3,max:50 }).withMessage('El nombre comercial debe tener al menos 3 caracteres y máximo 50'),
    body('Address')
        .notEmpty().withMessage('La dirección es obligatoria')
        .isLength({ min: 8,max:200 }).withMessage('La dirección debe tener al menos 8 caracteres maximo 200'),
    body('telephone')
        .notEmpty().withMessage('El teléfono es obligatorio')
        .custom((value) => {
            if (!validator.cellphone(value)) {
                throw new Error('El teléfono no es válido');
            }
            return true;
        }),
    body('email')
        .notEmpty().withMessage('El correo electrónico es obligatorio')
        .isEmail().withMessage('El correo electrónico no es válido')
        .isLength({ max: 100 }).withMessage('El correo electrónico no debe exceder los 100 caracteres'),
    body('state')
        .notEmpty().withMessage('El estado es obligatorio')
        .isString().withMessage('El estado debe ser un texto')
        .isIn(['al día', 'en deuda']).withMessage('El estado debe ser "al día" o "en deuda"'),
]

export const validateGetClient = [
    param('ruc')
        .notEmpty().withMessage('El RUC es obligatorio')
        .custom((value) => {
            if (!validator.ruc(value)) {
                throw new Error('El RUC no es válido');
            }
            return true;
        }),
]

export const validateUpdateClient = [
    param('ruc')
        .notEmpty().withMessage('El RUC es obligatorio')
        .custom((value) => {
            if (!validator.ruc(value)) {
                throw new Error('El RUC no es válido');
            }
            return true;
        }),
    body('Name')
        .optional()
        .isLength({ min: 3,max:50 }).withMessage('El nombre debe tener al menos 3 caracteres y máximo 50'),
    body('ComercialName')
        .optional()
        .isLength({ min: 3, max:50 }).withMessage('El nombre comercial debe tener al menos 3 caracteres y máximo 50'),
    body('Address')
        .optional()
        .isLength({ min: 8,max:200 }).withMessage('La dirección debe tener al menos 8 caracteres maximo 200'),
    body('telephone')
        .optional()
        .custom((value) => {
            if (!validator.cellphone(value)) {
                throw new Error('El teléfono no es válido');
            }
            return true;
        }),
    body('email')
        .optional()
        .isEmail().withMessage('El correo electrónico no es válido')
        .isLength({ max: 100 }).withMessage('El correo electrónico no debe exceder los 100 caracteres'),
    body('state')
        .optional()
        .isString().withMessage('El estado debe ser un texto')
        .isIn(['al día', 'en deuda']).withMessage('El estado debe ser "al día" o "en deuda"'),
]

export const validateDeleteClient = [
    param('id')
        .notEmpty().withMessage('El ID es obligatorio')
        .isMongoId().withMessage('El ID no es válido')
]

