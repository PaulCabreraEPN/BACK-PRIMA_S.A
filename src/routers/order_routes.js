import {Router} from 'express'
import { 
    createOrder, 
    updateStateOrder, 
    updateOrder,
    deleteOrder,
    SeeAllOrders,
    SeeOrderById 
} from '../controllers/orders_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'
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

router.post('/orders/create', verificarAutenticacion,validateCreateOrder, validateRequest, createOrder)
router.patch('/orders/update/state/:id', verificarAutenticacion,validateUpdateOrderStatus, validateRequest, updateStateOrder)
router.put('/orders/update/:id', verificarAutenticacion,validateUpdateOrder, validateRequest, updateOrder)
router.get("/orders",verificarAutenticacion,validateGetAllOrders,validateRequest,SeeAllOrders)
router.get("/orders/:id",verificarAutenticacion,validateGetOrderById, validateRequest,SeeOrderById)
router.delete("/orders/delete/:id",verificarAutenticacion,validateDeleteOrder,validateRequest,deleteOrder)




export default router
