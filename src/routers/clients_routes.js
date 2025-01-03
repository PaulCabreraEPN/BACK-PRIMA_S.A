import {Router} from 'express'
import { getAllClients, getClientsById } from '../controllers/clients_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.get('/clients',verificarAutenticacion,getAllClients )
router.get('/clients/:ruc',verificarAutenticacion,getClientsById)

export default router
