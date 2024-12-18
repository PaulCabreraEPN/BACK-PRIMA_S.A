import {Router} from 'express'
import { getAllProducts, getProductsById } from '../controllers/product_controller.js'

const router = Router()

router.get('/products',getAllProducts)
router.get('/products/:id',getProductsById)

export default router

