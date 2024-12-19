import {Router} from 'express'
import { confirmEmail, registerSeller, searchSellerById, searchSellerByNumberId, seeSellers,updateSellerController,UpdateAllSellerController,DeleteSellerController} from '../controllers/Seller_controller.js'
import {login_admin} from '../controllers/admin_controller.js'
import { verificarAutenticacion } from '../helpers/JWT.js'

const router = Router()

//* Rutas de inicio de sesion
router.post('/login-admin', login_admin)

//* Rutas Géstión Vendedores
// Ruta para registrar 
router.post('/register',registerSeller)
router.get('/confirm-account/:token',confirmEmail)
// Ruta para ver
router.get('/sellers', verificarAutenticacion, seeSellers)
// Rutas para Buscar
router.get('/sellers-numberid', verificarAutenticacion, searchSellerByNumberId)
router.get('/sellers/:id', verificarAutenticacion, searchSellerById)
// Rutas para actualizar 
router.patch("/updateSeller/:id", verificarAutenticacion, updateSellerController)
router.put("/updateAllSellerinfo/:id", verificarAutenticacion, UpdateAllSellerController)
// Ruta para Eliminar 
router.delete("/deleteSellerinfo/:id", verificarAutenticacion, DeleteSellerController)

export default router
