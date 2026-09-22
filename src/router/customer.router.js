import { Router } from "express";
import {getCustomerProfile,updateCustomerProfile} from "../controller/customer.controller.js"
import {verifyToken,authorizeRoles} from "../middleware/auth.middleware.js"
const CustomerRouter = Router()

CustomerRouter.get("/",verifyToken,authorizeRoles("customer"),getCustomerProfile)
CustomerRouter.put("/",verifyToken,authorizeRoles("customer"),updateCustomerProfile)
export default CustomerRouter