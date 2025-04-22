import {body,param} from 'express-validator'
import validator from 'ecuador-validator';

const patron = /^[A-Za-z0-9.\-/ ]+$/;

export const createProductValidator = [
    body('id')
        .notEmpty().withMessage('El id es obligatorio').isNumeric().withMessage('El id debe ser un número'),
    body('product_name')
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({min: 3}).withMessage('El nombre debe tener al menos 3 caracteres')
        .custom((value) => {
            if (!patron.test(value)) {
                throw new Error('El nombre solo puede contener letras, números, guiones y espacios');
            }
            return true;
        }),
    body('measure')
        .notEmpty().withMessage('La medida es obligatoria')
        .isLength({min: 3}).withMessage('La medida debe tener al menos 3 caracteres')
        .isIn(['UND','REP']).withMessage('La medida debe ser UND o REP'),
    body('price')
        .notEmpty().withMessage('El precio es obligatorio')
        .isFloat({ min: 0.01, max: 9999.99 }).withMessage('El precio debe estar entre 0.01 y 9999.99')
        .custom((value) => {
            if (value <= 0) {
                throw new Error('El precio debe ser mayor a 0');
            }
            return true;
        }),
    body('stock')
        .notEmpty().withMessage('El stock es obligatorio')
        .isInt({ min: 0, max: 9999 }).withMessage('El stock debe ser un número entero entre 0 y 9999')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El stock no puede ser negativo');
            }
            return true;
        }),
]

export const getProductValidator = [
    param('id')
        .notEmpty().withMessage('El id es obligatorio').isNumeric().withMessage('El id debe ser un número'),
]

export const updateProductValidator = [
    param('id')
        .notEmpty().withMessage('El id es obligatorio').isNumeric().withMessage('El id debe ser un número'),
    body('product_name')
        .optional()
        .isLength({min: 3}).withMessage('El nombre debe tener al menos 3 caracteres')
        .custom((value) => {
            if (!patron.test(value)) {
                throw new Error('El nombre solo puede contener letras, números, guiones y espacios');
            }
            return true;
        }),
    body('measure')
        .optional()
        .isLength({min: 3}).withMessage('La medida debe tener al menos 3 caracteres')
        .isIn(['UND','REP']).withMessage('La medida debe ser UND o REP'),
    body('price')
        .optional()
        .isFloat({ min: 0.01, max: 9999.99 }).withMessage('El precio debe estar entre 0.01 y 9999.99')
        .custom((value) => {
            if (value <= 0) {
                throw new Error('El precio debe ser mayor a 0');
            }
            return true;
        }),
    body('stock')
        .optional()
        .isInt({ min: 0, max: 9999 }).withMessage('El stock debe ser un número entero entre 0 y 9999')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El stock no puede ser negativo');
            }
            return true;
        }),
]

export const deleteProductValidator = [
    param('id')
        .notEmpty().withMessage('El id es obligatorio').isNumeric().withMessage('El id debe ser un número'),
]