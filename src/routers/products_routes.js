import {Router} from 'express'
import { CreateProduct,getAllProducts, getProductsById,updatedProduct,deleteProduct } from '../controllers/product_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'
import processImage from '../middlewares/claudinary_middleware.js'
import {upload} from '../middlewares/multer.js'

const router = Router()
router.post('/products/register', verificarAutenticacion,upload.single('image'),processImage, CreateProduct)
router.get('/products', verificarAutenticacion, getAllProducts)
router.get('/products/:id', verificarAutenticacion, getProductsById)
router.patch('/products/update/:id', verificarAutenticacion,upload.single('image'),processImage, updatedProduct)
router.delete('/products/delete/:id', verificarAutenticacion, deleteProduct)

export default router

