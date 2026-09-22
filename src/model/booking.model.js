import mongoose, { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    maid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maid",
      required: true,
    },

    serviceDate: {
      type: Date,
      required: true,
    },

    serviceTime: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // Amount locked at booking time
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Booking Status
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "Cancelled",
        "Completed",
      ],
      default: "Pending",
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    // Payment Reference
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Booking", bookingSchema);