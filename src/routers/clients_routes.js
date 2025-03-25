import {Router} from 'express'
import { RegisterClient,getAllClients, getClientsById,UpdateClient,DeleteClient } from '../controllers/clients_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'

const router = Router()

router.post('/clients/register',verificarAutenticacion,RegisterClient)
router.get('/clients',verificarAutenticacion,getAllClients )
router.get('/clients/:ruc',verificarAutenticacion,getClientsById)
router.patch('/clients/update/:ruc',verificarAutenticacion,UpdateClient)
router.delete('/clients/delete/:id',verificarAutenticacion,DeleteClient)

export default router
