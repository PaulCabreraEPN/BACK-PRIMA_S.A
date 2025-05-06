import { Router } from "express";
import { getAllCount, GetSalesBySeller, GetTopSellers, getWeeklySales } from "../controllers/statics_controller.js";
import { authorizeRole, verificarAutenticacion } from "../middlewares/JWT.js";

const router = Router();

router.get('/statics/count', verificarAutenticacion,authorizeRole(['admin']), getAllCount)
router.get('/statics/top-sellers', verificarAutenticacion,authorizeRole(['admin']), GetTopSellers)
router.get('/statics/sales-by-seller', verificarAutenticacion,authorizeRole(['admin']), GetSalesBySeller)
router.get('/statics/orders-by-week', verificarAutenticacion,authorizeRole(['admin']), getWeeklySales)

export default router;