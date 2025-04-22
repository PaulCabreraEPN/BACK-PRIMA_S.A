import {Router} from 'express'
import { RegisterClient,getAllClients, getClientsById,UpdateClient,DeleteClient } from '../controllers/clients_controller.js'
import { verificarAutenticacion } from '../middlewares/JWT.js'
import { validateCreateClient, validateGetClient, validateUpdateClient, validateDeleteClient } from '../validators/clients_validator.js'
import { validateRequest } from '../middlewares/validator_middleware.js';

const router = Router()

router.post('/clients/register',verificarAutenticacion,validateCreateClient,validateRequest,RegisterClient)
router.get('/clients',verificarAutenticacion,getAllClients )
router.get('/clients/:ruc',verificarAutenticacion,validateGetClient,validateRequest,getClientsById)
router.patch('/clients/update/:ruc',verificarAutenticacion,validateUpdateClient,validateRequest,UpdateClient)
router.delete('/clients/delete/:id',verificarAutenticacion,validateDeleteClient,validateRequest,DeleteClient)

export default router
