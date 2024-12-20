import {Router} from 'express'
import { getAllProducts, getProductsById } from '../controllers/product_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.get('/products', verificarAutenticacion, getAllProducts)
router.get('/products/:id', verificarAutenticacion, getProductsById)

export default router

