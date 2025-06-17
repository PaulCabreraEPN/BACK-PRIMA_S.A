import {Router} from 'express'
import { 
    createOrder, 
    updateStateOrder, 
    updateOrder,
    deleteOrder,
    SeeAllOrders,
    SeeOrderById 
} from '../controllers/orders_controller.js'
import { verificarAutenticacion ,authorizeRole } from '../middlewares/JWT.js'
import {
    validateCreateOrder,
    validateUpdateOrder,
    validateUpdateOrderStatus,
    validateGetOrderById,
    validateDeleteOrder,
} from '../validators/order_validator.js';
import { validateRequest } from '../middlewares/validator_middleware.js';

const router = Router()

router.post('/orders/create', verificarAutenticacion,authorizeRole(['seller']),validateCreateOrder, validateRequest, createOrder)
router.patch('/orders/update/state/:id', verificarAutenticacion,authorizeRole(['admin','seller']),validateUpdateOrderStatus, validateRequest, updateStateOrder)
router.patch('/orders/update/:id', verificarAutenticacion,authorizeRole(['seller']),validateUpdateOrder, validateRequest, updateOrder)
router.get("/orders",verificarAutenticacion,authorizeRole(['seller','admin']),validateRequest,SeeAllOrders)
router.get("/orders/:id",verificarAutenticacion,authorizeRole(['seller','admin']),validateGetOrderById, validateRequest,SeeOrderById)
router.delete("/orders/delete/:id",verificarAutenticacion,authorizeRole(['admin','seller']),validateDeleteOrder,validateRequest,deleteOrder)




export default router
