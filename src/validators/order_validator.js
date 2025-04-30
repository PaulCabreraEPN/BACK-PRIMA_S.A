import pkg from 'express-validator';
const { body, param, query, validationResult, check } = pkg;
import validator from 'ecuador-validator'

// Validaciones para la creación de pedido
const validateCreateOrder = [
    body('customer')
        .notEmpty().withMessage('El cliente es requerido')
        .custom((value) => {
            if (!validator.ruc(value)) {
                throw new Error('Ruc inválido');
            }
            return true;
        }),

    body('products')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto')
        .custom((products) => {
            return products.every(product => {
                return product.productId &&
                    Number.isInteger(product.quantity) &&
                    product.quantity > 0;
            });
        }).withMessage('Productos inválidos'),

    body('products.*.productId')
        .notEmpty().withMessage('ID de producto requerido')
        .isString().withMessage('ID de producto debe ser un string'),

    body('products.*.quantity')
        .isInt({ min: 1 }).withMessage('Cantidad debe ser un número entero positivo'),

    body('discountApplied')
        .isFloat({ min: 0, max: 100 }).withMessage('Descuento debe ser un número entre 0 y 100'),

    body('netTotal')
        .isFloat({ min: 0 }).withMessage('Total neto debe ser un número positivo')
        .custom((value) => {
            const regex = /^\d+(\.\d{1,2})?$/;
            if (!regex.test(value.toString())) {
                throw new Error('Total neto no puede tener más de dos decimales');
            }
            return true;
        }),

    body('totalWithTax')
        .isFloat({ min: 0 }).withMessage('Total con impuestos debe ser un número positivo')
        .custom((value) => {
            const regex = /^\d+(\.\d{1,2})?$/;
            if (!regex.test(value.toString())) {
                throw new Error('Total neto no puede tener más de dos decimales');
            }
            return true;
        })
        .custom((value, { req }) => {
            return value >= req.body.netTotal;
        }).withMessage('Total con impuestos debe ser mayor o igual al total neto'),

    body('comment')
        .optional()
        .isString().withMessage('Comentario debe ser texto')
        .isLength({ min: 10, max: 100 }).withMessage('El comentario debe tener entre 10 y 50 caracteres'),
];

// Validaciones para la actualización de pedido
const validateUpdateOrder = [
    param('id')
        .isMongoId().withMessage('ID de pedido inválido'),

    body('products')
        .optional()
        .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto')
        .custom((products) => {
            return products.every(product => {
                return product.productId &&
                    Number.isInteger(product.quantity) &&
                    product.quantity > 0;
            });
        }).withMessage('Productos inválidos'),

    body('discountApplied')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Descuento debe ser un número entre 0 y 100'),

    body('netTotal')
        .isFloat({ min: 0 }).withMessage('Total neto debe ser un número positivo')
        .custom((value) => {
            const regex = /^\d+(\.\d{1,2})?$/;
            if (!regex.test(value.toString())) {
                throw new Error('Total neto no puede tener más de dos decimales');
            }
            return true;
        }),

    body('totalWithTax')
        .isFloat({ min: 0 }).withMessage('Total con impuestos debe ser un número positivo')
        .custom((value) => {
            const regex = /^\d+(\.\d{1,2})?$/;
            if (!regex.test(value.toString())) {
                throw new Error('Total neto no puede tener más de dos decimales');
            }
            return true;
        })
        .custom((value, { req }) => {
            return value >= req.body.netTotal;
        }).withMessage('Total con impuestos debe ser mayor o igual al total neto'),

    body('status')
        .optional()
        .isIn(['Pendiente', 'En proceso', 'Enviado', 'Cancelado'])
        .withMessage('Estado inválido'),

    body('comment')
        .optional()
        .isString().withMessage('Comentario debe ser texto')
        .isLength({ max: 500 }).withMessage('Comentario demasiado largo')
];

// Validaciones para la actualización de estado de pedido
const validateUpdateOrderStatus = [
    param('id')
        .isMongoId().withMessage('ID de pedido inválido'),

    body('status')
        .notEmpty().withMessage('El estado es requerido')
        .isIn(['Pendiente', 'En proceso', 'Enviado', 'Cancelado'])
        .withMessage('Estado inválido- Estados válidos: Pendiente, En proceso, Enviado, Cancelado'),
];

// Validaciones para obtener pedido por ID
const validateGetOrderById = [
    param('id').isMongoId().withMessage('ID de pedido inválido')
];



// Validar parámetros de consulta para listar órdenes
const validateGetAllOrders = [
    query('status')
        .optional()
        .isIn(['Pendiente', 'En proceso', 'Enviado', 'Cancelado'])
        .withMessage('Estado inválido'),

    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Fecha inicial inválida'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Fecha final inválida'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página inválida'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite inválido')
];

// Validar eliminación de orden
const validateDeleteOrder = [
    param('id')
        .isMongoId()
        .withMessage('ID de orden inválido')
];



export {
    validateCreateOrder,
    validateUpdateOrder,
    validateUpdateOrderStatus,
    validateGetOrderById,
    validateGetAllOrders,
    validateDeleteOrder,

}