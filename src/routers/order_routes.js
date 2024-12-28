import {Router} from 'express'
import { createOrder, updateStateOrder,getAllOrders } from '../controllers/orders_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.post('/orders/create', verificarAutenticacion, createOrder)
router.patch('/orders/update/state/:id', verificarAutenticacion, updateStateOrder)
router.get("/seeOrders",verificarAutenticacion,getAllOrders)

export default router
