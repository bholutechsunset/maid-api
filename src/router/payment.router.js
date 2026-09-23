import { Router } from "express";
import express from "express"
import { createOrder ,webhook } from "../controller/payment.controller.js";
import { verifyToken,authorizeRoles} from "../middleware/auth.middleware.js";

const PaymentRouter = Router();

PaymentRouter.post("/create-order/:id",verifyToken,authorizeRoles("customer"),createOrder);
PaymentRouter.post("/webhook",express.raw({ type: "application/json" }),webhook);

export default PaymentRouter;