import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import catalogRouter from "./catalog";
import adminRouter from "./admin";
import authRouter from "./auth";
import addressesRouter from "./addresses";
import checkoutRouter from "./checkout";
import newsletterRouter from "./newsletter";
import bannersRouter from "./banners";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(catalogRouter);
router.use(adminRouter);
router.use("/auth", authRouter);
router.use(addressesRouter);
router.use(checkoutRouter);
router.use(newsletterRouter);
router.use(bannersRouter);
router.use(uploadRouter);

export default router;
