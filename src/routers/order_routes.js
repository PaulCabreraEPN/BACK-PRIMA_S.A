import {Router} from 'express'
import { createOrder, updateStateOrder,getAllOrders,listOrders, updateOrder,deleteOrder } from '../controllers/orders_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.post('/orders/create', verificarAutenticacion, createOrder)
router.patch('/orders/update/state/:id', verificarAutenticacion, updateStateOrder)
router.put('/orders/update/:id', verificarAutenticacion, updateOrder)
router.get("/orders",verificarAutenticacion,getAllOrders)
router.get("/seeOrdersProducts",verificarAutenticacion,listOrders)
router.delete("/deleteOrder/:id",deleteOrder)

export default router
