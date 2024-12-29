import {Router} from 'express'
import { getAllClients, getClientsById } from '../controllers/clients_controller.js'

const router = Router()

router.get('/clients',getAllClients )
router.get('/clients/:ruc',getClientsById)

export default router