import dotenv from "dotenv"
dotenv.config()

import mongoose from "mongoose"
mongoose.connect(process.env.DB)

.then(()=>console.log("connected"))

.catch((err)=>console.log("not connected"))

import express from "express"
import cors from "cors"
import UserRouter from "./src/router/auth.router.js"
import MaidRouter from "./src/router/maid.router.js"
import CustomerRouter from "./src/router/customer.router.js"
import BookingRouter from "./src/router/booking.router.js"
import PaymentRouter from "./src/router/payment.router.js"

const app = express()
app.listen( process.env.PORT || 8080,()=>console.log(`Server is start with PORT:${process.env.PORT || 8080}`))

app.use(cors({
    origin:" http://localhost:5174",
    credentials:true
}))

app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use("/auth",UserRouter)
app.use("/maid",MaidRouter)
app.use("/customer",CustomerRouter)
app.use("/booking",BookingRouter)
app.use("/payment",PaymentRouter)
