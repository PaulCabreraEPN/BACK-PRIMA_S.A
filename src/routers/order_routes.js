import {Router} from 'express'
import { createOrder, updateStateOrder, updateOrder,deleteOrder,SeeAllOrders } from '../controllers/orders_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.post('/orders/create', verificarAutenticacion, createOrder)
router.patch('/orders/update/state/:id', verificarAutenticacion, updateStateOrder)
router.put('/orders/update/:id', verificarAutenticacion, updateOrder)
router.get("/SeeAllOrders",verificarAutenticacion,SeeAllOrders)
router.delete("/deleteOrder/:id",verificarAutenticacion,deleteOrder)




export default router
