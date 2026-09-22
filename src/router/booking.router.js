import Router from "express"
import { 
    createBooking,
    getMaidBookings,
    acceptBooking,
    rejectBooking ,
    getCustomerBookings,
    getBookingDetails,
    completeBooking,
    cancelBooking
} from "../controller/booking.controller.js"
import {verifyToken,authorizeRoles} from "../middleware/auth.middleware.js"

const BookingRouter = Router()
BookingRouter.post("/",verifyToken,authorizeRoles("customer"),createBooking)
BookingRouter.get("/maid",verifyToken,authorizeRoles("maid"),getMaidBookings)
BookingRouter.patch("/:id/accept",verifyToken,authorizeRoles("maid"),acceptBooking)
BookingRouter.patch("/:id/reject",verifyToken,authorizeRoles("maid"),rejectBooking)
BookingRouter.get("/customer",verifyToken,authorizeRoles("customer"),getCustomerBookings)
BookingRouter.get("/:id",verifyToken,authorizeRoles("maid","customer"),getBookingDetails)
BookingRouter.patch("/:id/complete",verifyToken,authorizeRoles("maid"),completeBooking)
BookingRouter.patch("/:id/cancel",verifyToken,authorizeRoles("customer"),cancelBooking)

export default BookingRouter 