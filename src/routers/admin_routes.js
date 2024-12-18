import {Router} from 'express'
import { confirmEmail, registerSeller, searchSellerById, searchSellerByNumberId, seeSellers,updateSellerController,UpdateAllSellerController,DeleteSellerController} from '../controllers/Seller_controller.js'

const router = Router()

//* Rutas Vendedores
// Ruta para registrar 
router.post("/register",registerSeller)
router.get('/confirm-account/:token',confirmEmail)
// Ruta para ver
router.get('/sellers',seeSellers)
// Rutas para Buscar
router.get('/sellers-numberid',searchSellerByNumberId)
router.get('/sellers/:id', searchSellerById)
// Rutas para actualizar 
router.patch("/updateSeller/:id",updateSellerController)
router.put("/updateAllSellerinfo/:id",UpdateAllSellerController)
// Ruta para Eliminar 
router.delete("/deleteSellerinfo/:id",DeleteSellerController)

//* Rutas Inventario

export default router
