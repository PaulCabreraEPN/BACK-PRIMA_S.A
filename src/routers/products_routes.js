import {Router} from 'express'
import { CreateProduct,getAllProducts, getProductsById,updatedProduct,deleteProduct } from '../controllers/product_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'
import processImage from '../middlewares/claudinary_middleware.js'
import {upload} from '../middlewares/multer.js'
import { createProductValidator, getProductValidator, updateProductValidator ,deleteProductValidator } from '../validators/products_validator.js'
import {validateRequest} from '../middlewares/validator_middleware.js'
import {imageRequired} from '../middlewares/errorhandler.js'

const router = Router()
router.post('/products/register', verificarAutenticacion,upload.single('image'),imageRequired,createProductValidator,validateRequest,processImage, CreateProduct)
router.get('/products', verificarAutenticacion, getAllProducts)
router.get('/products/:id', verificarAutenticacion,getProductValidator,validateRequest, getProductsById)
router.patch('/products/update/:id', verificarAutenticacion,upload.single('image'),updateProductValidator,validateRequest,processImage, updatedProduct)
router.delete('/products/delete/:id', verificarAutenticacion,deleteProductValidator,validateRequest, deleteProduct)

export default router

