import { Router } from "express";
import { createOrder } from "../controller/payment.controller.js";
import { verifyToken,authorizeRoles} from "../middleware/auth.middleware.js";

const PaymentRouter = Router();

PaymentRouter.post("/create-order/:id",verifyToken,authorizeRoles("customer"),createOrder);

export default PaymentRouter;