import {Router} from 'express'
import { createOrder, updateStateOrder } from '../controllers/orders_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.post('/orders/create', verificarAutenticacion, createOrder)
router.patch('/orders/update/state', verificarAutenticacion, updateStateOrder)

export default router