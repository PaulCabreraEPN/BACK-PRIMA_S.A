import {Router} from 'express'
import { createOrder } from '../controllers/orders_controller.js'

const router = Router()

router.post('/create-orders',createOrder)

export default router