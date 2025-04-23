import {Router} from 'express'
import { 
    confirmEmail, 
    registerSeller, 
    searchSellerById, 
    searchSellerByNumberId, 
    seeSellers,
    updateSellerController,
    DeleteSellerController, 
    loginSeller,
    passwordRecovery,
    tokenComprobation,
    newPassword
} from '../controllers/Seller_controller.js'
import {login_admin, recovery_pass_admin} from '../controllers/admin_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'
import { 
    validateCreateSeller, 
    validateUpdateSeller,
    validateFindSellerById,
    validateFindSellerByNumberId 
} from '../validators/seller_validator.js';
import {
    validateAdminLogin,
    validateAdminPasswordRecovery,
    validateSellerLogin,
    validateSellerPasswordRecoveryRequest,
    validatePasswordRecoveryToken,
    validateNewPassword
} from '../validators/auth_validator.js';
import { validateRequest } from '../middlewares/validator_middleware.js';


const router = Router()

//* Rutas de inicio de sesion
router.post('/login-admin',validateAdminLogin,validateRequest, login_admin)
// Ruta para recuperar contraseña
router.post('/recovery-password-admin',validateAdminPasswordRecovery,validateRequest, recovery_pass_admin)

//* Rutas Géstión Vendedores
// Ruta para registrar 
router.post('/register',verificarAutenticacion,validateCreateSeller,validateRequest,registerSeller)
router.get('/confirm-account/:token',validatePasswordRecoveryToken,validateRequest,confirmEmail)
router.post('/login',validateSellerLogin,validateRequest,loginSeller)
router.post('/recovery-password',validateSellerPasswordRecoveryRequest,validateRequest,passwordRecovery)
router.get('/recovery-password/:token',validatePasswordRecoveryToken,validateRequest,tokenComprobation)
router.post('/recovery-password/:token',validateNewPassword,validateRequest,newPassword)
// Ruta para ver
router.get('/sellers', verificarAutenticacion, seeSellers)
// Rutas para Buscar
router.get('/sellers-numberid/:numberID', verificarAutenticacion,validateFindSellerByNumberId,validateRequest, searchSellerByNumberId)
router.get('/sellers/:id', verificarAutenticacion,validateFindSellerById,validateRequest, searchSellerById)
// Rutas para actualizar 
router.patch("/updateSeller/:id", verificarAutenticacion,validateUpdateSeller,validateRequest, updateSellerController)
// Ruta para Eliminar 
router.delete("/deleteSellerinfo/:id", verificarAutenticacion,validateFindSellerById, validateRequest, DeleteSellerController)

export default router
