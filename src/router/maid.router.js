import { Router } from "express";
import { getMaids,getMaidDetails,getMaidProfile,updateMaidProfile} from "../controller/maid.controller.js";
import { verifyToken,authorizeRoles } from "../middleware/auth.middleware.js";
const MaidRouter  = Router()
MaidRouter.get("/maids",verifyToken,authorizeRoles("maid"),getMaids)
MaidRouter.get("/details/:id",verifyToken,authorizeRoles("maid"),getMaidDetails)
MaidRouter.get("/profile",verifyToken,authorizeRoles("maid"),getMaidProfile)
MaidRouter.put("/profile",verifyToken,authorizeRoles("maid"),updateMaidProfile)
export default MaidRouter