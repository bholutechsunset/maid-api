
import { Router } from "express";
import { signup,login } from "../controller/auth.controller.js";
const UserRouter = Router()

UserRouter.post("/signup",signup)
UserRouter.post("/login",login)

export default UserRouter