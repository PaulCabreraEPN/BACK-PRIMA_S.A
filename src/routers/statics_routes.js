import { Router } from "express";
import { getAllCount, GetSalesBySeller, GetTopSellers } from "../controllers/statics_controller.js";
import { verificarAutenticacion } from "../middlewares/JWT.js";

const router = Router();

router.get('/statics/count', verificarAutenticacion, getAllCount)
router.get('/statics/top-sellers', verificarAutenticacion, GetTopSellers)
router.get('/statics/sales-by-seller', verificarAutenticacion, GetSalesBySeller)

export default router;