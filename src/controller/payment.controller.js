import BookingModel from "../model/booking.model.js";
import PaymentModel from "../model/payment.model.js"
import CustomerModel from "../model/customer.mode.js";
import razorpay from "../utils/razorpay.utils.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const {id} = req.params;

    // Find Customer Profile
    const customer = await CustomerModel.findOne({
      auth: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    // Find Booking
    const booking = await BookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Booking Owner Validation
    if (booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay for this booking.",
      });
    }

    // Booking Status Validation
    if (booking.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled booking cannot be paid.",
      });
    }

    if (booking.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected booking cannot be paid.",
      });
    }

    // Already Paid
    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed.",
      });
    }

    // Existing Pending Payment
    const existingPayment = await PaymentModel.findOne({
      booking: booking._id,
      status: "Pending",
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Existing payment order found.",
        data: {
          key: process.env.RAZORPAY_KEY_ID,
          orderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount * 100,
          currency: existingPayment.currency,
        },
      });
    }
    // Create Razorpay Order
    const options = {
      amount: booking.amount * 100, // Razorpay accepts amount in paise
      currency: "INR",
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);

    // Save Payment
    const payment = await PaymentModel.create({
      booking: booking._id,
      customer: customer._id,
      amount: booking.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      status: "Pending",
    });

    // Update Booking
    booking.payment = payment._id;
    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully.",
      data: {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const webhook = async (req, res) => {
  try {
    console.log("===== WEBHOOK HIT =====");
    console.log(req.headers["x-razorpay-signature"]);
    console.log(req.body);
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is missing.",
      });
    }

    // req.body should be RAW Buffer
    const rawBody = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    // Convert Buffer -> JSON
    const body = JSON.parse(rawBody.toString());

    const event = body.event;

    // ------------------------
    // PAYMENT CAPTURED
    // ------------------------
    if (event === "payment.captured") {
      const paymentEntity = body.payload.payment.entity;

      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const paymentMethod = paymentEntity.method;

      const payment = await PaymentModel.findOne({
        razorpayOrderId,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found.",
        });
      }

      // Prevent duplicate updates
      if (payment.status !== "Paid") {
        await PaymentModel.findByIdAndUpdate(payment._id, {
          status: "Paid",
          razorpayPaymentId,
          paymentMethod,
        });

        await BookingModel.findByIdAndUpdate(payment.booking, {
          paymentStatus: "Paid",
        });
      }
    }

    // ------------------------
    // PAYMENT FAILED
    // ------------------------
    if (event === "payment.failed") {
      const paymentEntity = body.payload.payment.entity;

      const payment = await PaymentModel.findOne({
        razorpayOrderId: paymentEntity.order_id,
      });

      if (payment) {
        await PaymentModel.findByIdAndUpdate(payment._id, {
          status: "Failed",
        });

        await BookingModel.findByIdAndUpdate(payment.booking, {
          paymentStatus: "Failed",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully.",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};