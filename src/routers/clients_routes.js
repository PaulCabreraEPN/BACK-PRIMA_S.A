import {Router} from 'express'
import { RegisterClient,getAllClients, getClientsById,UpdateClient,DeleteClient } from '../controllers/clients_controller.js'
import { verificarAutenticacion, authorizeRole } from '../middlewares/JWT.js'
import { validateCreateClient, validateGetClient, validateUpdateClient, validateDeleteClient } from '../validators/clients_validator.js'
import { validateRequest } from '../middlewares/validator_middleware.js';

const router = Router()

router.post('/clients/register',verificarAutenticacion,authorizeRole(['admin','seller']),validateCreateClient,validateRequest,RegisterClient)
router.get('/clients',verificarAutenticacion,authorizeRole(['admin','seller']),getAllClients )
router.get('/clients/:ruc',verificarAutenticacion,authorizeRole(['admin','seller']),validateGetClient,validateRequest,getClientsById)
router.patch('/clients/update/:ruc',verificarAutenticacion,authorizeRole(['admin','seller']),validateUpdateClient,validateRequest,UpdateClient)
router.delete('/clients/delete/:id',verificarAutenticacion,authorizeRole(['admin']),validateDeleteClient,validateRequest,DeleteClient)

export default router
