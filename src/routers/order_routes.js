import {Router} from 'express'
import { createOrder } from '../controllers/orders_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.post('/create-orders',verificarAutenticacion,createOrder)

export default router