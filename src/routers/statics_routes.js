import { Router } from "express";
import { getAllCount } from "../controllers/statics_controller.js";
import { verificarAutenticacion } from "../middlewares/JWT.js";

const router = Router();

router.get('/statics/count', verificarAutenticacion, getAllCount)

export default router;