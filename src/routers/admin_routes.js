import {Router} from 'express'
import { confirmEmail, registerSeller, searchSellerById, searchSellerByNumberId, seeSellers,updateSellerController,UpdateAllSellerController,DeleteSellerController, loginSeller,passwordRecovery,tokenComprobation,newPassword} from '../controllers/Seller_controller.js'
import {login_admin, recovery_pass_admin} from '../controllers/admin_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

//* Rutas de inicio de sesion
router.post('/login-admin', login_admin)
// Ruta para recuperar contraseña
router.post('/recovery-password-admin', recovery_pass_admin)

//* Rutas Géstión Vendedores
// Ruta para registrar 
router.post('/register',verificarAutenticacion,registerSeller)
router.get('/confirm-account/:token',confirmEmail)
router.post('/login',loginSeller)
router.post('/recovery-password',passwordRecovery)
router.get('/recovery-password/:token',tokenComprobation)
router.post('/recovery-password/:token',newPassword)
// Ruta para ver
router.get('/sellers', verificarAutenticacion, seeSellers)
// Rutas para Buscar
router.get('/sellers-numberid/:numberID', verificarAutenticacion, searchSellerByNumberId)
router.get('/sellers/:id', verificarAutenticacion, searchSellerById)
// Rutas para actualizar 
router.patch("/updateSeller/:id", verificarAutenticacion, updateSellerController)
router.put("/updateAllSellerinfo/:id", verificarAutenticacion, UpdateAllSellerController)
// Ruta para Eliminar 
router.delete("/deleteSellerinfo/:id", verificarAutenticacion, DeleteSellerController)

export default router
