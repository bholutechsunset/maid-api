import dotenv from "dotenv"
dotenv.config()

import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/maid")

.then(()=>console.log("connected"))

.catch((err)=>console.log("not connected"))

import express from "express"
// import cors from "cors"
import UserRouter from "./src/router/auth.router.js"
import MaidRouter from "./src/router/maid.router.js"
import CustomerRouter from "./src/router/customer.router.js"
import BookingRouter from "./src/router/booking.router.js"
import PaymentRouter from "./src/router/payment.router.js"

const app = express()
app.listen(8080,()=>console.log(`Server is start with port 8000`))

// app.use(cors({
//     origin:" http://localhost:5173",
//     credentials:true
// }))

app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use("/auth",UserRouter)
app.use("/maid",MaidRouter)
app.use("/customer",CustomerRouter)
app.use("/booking",BookingRouter)
app.use("/payment",PaymentRouter)
