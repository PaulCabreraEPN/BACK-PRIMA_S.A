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
    validateGetAllOrders
} from '../validators/order_validator.js';
import { validateRequest } from '../middlewares/validator_middleware.js';

const router = Router()

router.post('/orders/create', verificarAutenticacion,authorizeRole(['Seller']),validateCreateOrder, validateRequest, createOrder)
router.patch('/orders/update/state/:id', verificarAutenticacion,authorizeRole(['admin']),validateUpdateOrderStatus, validateRequest, updateStateOrder)
router.patch('/orders/update/:id', verificarAutenticacion,authorizeRole(['Seller']),validateUpdateOrder, validateRequest, updateOrder)
router.get("/orders",verificarAutenticacion,authorizeRole(['Seller','admin']),validateGetAllOrders,validateRequest,SeeAllOrders)
router.get("/orders/:id",verificarAutenticacion,authorizeRole(['Seller','admin']),validateGetOrderById, validateRequest,SeeOrderById)
router.delete("/orders/delete/:id",verificarAutenticacion,authorizeRole(['admin']),validateDeleteOrder,validateRequest,deleteOrder)




export default router
