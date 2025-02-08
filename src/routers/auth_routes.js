// routes/authRoutes.js
import express from 'express'
import { verificarEstadoToken } from '../middlewares/JWT.js'

const router = express.Router()

// Añade esta ruta
router.get('/verify-token', verificarEstadoToken)

export default router