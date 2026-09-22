import mongoose from "mongoose";
import BookingModel from "../model/booking.model.js";
import CustomerModel from "../model/customer.mode.js";
import MaidModel from "../model/maid.model.js";


export const createBooking = async (req, res) => {
  try {
    console.log("hi1")
    const { maidId, serviceDate, serviceTime, address, notes } = req.body;

    // Required fields
    if (!maidId || !serviceDate || !serviceTime || !address) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory.",
      });
    }

    // Find Customer Profile
    console.log("hi2")
    console.log(req.user.id)
    const customer = await CustomerModel.findOne({
      auth: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    // Find Maid
    console.log(maidId)
    console.log("id done")
    const maid = await MaidModel.findById(maidId);

    if (!maid) {
      return res.status(404).json({
        success: false,
        message: "Maid not found.",
      });
    }

    // Maid Availability
    if (!maid.availability) {
      return res.status(400).json({
        success: false,
        message: "Maid is currently unavailable.",
      });
    }

    // Duplicate Pending Booking
    const existingBooking = await BookingModel.findOne({
      customer: customer._id,
      maid: maid._id,
      status: "Pending",
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending booking for this maid.",
      });
    }

    // Create Booking
    const booking = await BookingModel.create({
      customer: customer._id,
      maid: maid._id,
      serviceDate,
      serviceTime,
      address,
      notes,
      amount: maid.salary, // Future me serviceCharge ya pricePerVisit
      status: "Pending",
    });

    res.json({
      success: true,
      message: "Booking created successfully.",
      data: booking,
    });
  } 
  catch(err)
  {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMaidBookings = async (req, res) => {
  try {
    
    const maid = await MaidModel.findOne({
      auth: req.user.id,
    });

    if (!maid) {
      return res.status(404).json({
        success: false,
        message: "Maid profile not found.",
      });
    }

    const bookings = await BookingModel.aggregate([
      {
        $match: {
          maid: maid._id,
        },
      },

      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },

      {
        $unwind: "$customer",
      },

      {
        $lookup: {
          from: "auths",
          localField: "customer.auth",
          foreignField: "_id",
          as: "customerAuth",
        },
      },

      {
        $unwind: "$customerAuth",
      },

      {
        $project: {
          _id: 1,
          serviceDate: 1,
          serviceTime: 1,
          address: 1,
          notes: 1,
          status: 1,

          customer: {
            _id: "$customer._id",
            name: "$customerAuth.name",
            email: "$customerAuth.email",
            phone: "$customer.phone",
            address: "$customer.address",
            profileImage: "$customer.profileImage",
          },
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Maid Profile
    const maid = await MaidModel.findOne({
      auth: req.user.id,
    });

    if (!maid) {
      return res.status(404).json({
        success: false,
        message: "Maid profile not found.",
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

    console.log("Booking Maid:", booking.maid.toString());
    console.log("Logged-in Maid:", maid._id.toString());
    // Check Booking belongs to logged in Maid
    if (booking.maid.toString() !== maid._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this booking.",
      });
    }

    // Booking must be Pending
    if (booking.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}.`,
      });
    }

    // Accept Booking
    booking.status = "Accepted";
    await booking.save();

    // Optional
    maid.availability = false;
    await maid.save();

    return res.status(200).json({
      success: true,
      message: "Booking accepted successfully.",
      data: booking,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Logged-in Maid
    const maid = await MaidModel.findOne({
      auth: req.user.id,
    });

    if (!maid) {
      return res.status(404).json({
        success: false,
        message: "Maid profile not found.",
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

    // Authorization
    if (booking.maid.toString() !== maid._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this booking.",
      });
    }

    // Status Validation
    if (booking.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}.`,
      });
    }

    // Reject Booking
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      id,
      {
        status: "Rejected",
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Booking rejected successfully.",
      data: updatedBooking,
    });

  }catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    // Find Logged-in Customer
    const customer = await CustomerModel.findOne({
      auth: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    // Get Customer Bookings
    const bookings = await BookingModel.aggregate([
      {
        $match: {
          customer: customer._id,
        },
      },

      {
        $lookup: {
          from: "maids",
          localField: "maid",
          foreignField: "_id",
          as: "maid",
        },
      },

      {
        $unwind: "$maid",
      },

      {
        $lookup: {
          from: "auths",
          localField: "maid.auth",
          foreignField: "_id",
          as: "maidAuth",
        },
      },

      {
        $unwind: "$maidAuth",
      },

      {
        $project: {
          _id: 1,
          serviceDate: 1,
          serviceTime: 1,
          address: 1,
          notes: 1,
          status: 1,

          maid: {
            _id: "$maid._id",
            name: "$maidAuth.name",
            email: "$maidAuth.email",
            phone: "$maid.phone",
            address: "$maid.address",
            profileImage: "$maid.profileImage",
            experience: "$maid.experience",
            salary: "$maid.salary",
            skills: "$maid.skills",
            availability: "$maid.availability",
            rating: "$maid.rating",
            totalReviews: "$maid.totalReviews",
          },
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Booking Id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id.",
      });
    }

    // Check Booking Exists
    const booking = await BookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Customer Authorization
    if (req.user.role === "customer") {
      const customer = await CustomerModel.findOne({
        auth: req.user.id,
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found.",
        });
      }

      if (booking.customer.toString() !== customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this booking.",
        });
      }
    }

    // Maid Authorization
    if (req.user.role === "maid") {
      const maid = await MaidModel.findOne({
        auth: req.user.id,
      });

      if (!maid) {
        return res.status(404).json({
          success: false,
          message: "Maid profile not found.",
        });
      }

      if (booking.maid.toString() !== maid._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this booking.",
        });
      }
    }

    // Booking Details
    const result = await BookingModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      // Customer
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: "$customer",
      },

      // Customer Auth
      {
        $lookup: {
          from: "auths",
          localField: "customer.auth",
          foreignField: "_id",
          as: "customerAuth",
        },
      },
      {
        $unwind: "$customerAuth",
      },

      // Maid
      {
        $lookup: {
          from: "maids",
          localField: "maid",
          foreignField: "_id",
          as: "maid",
        },
      },
      {
        $unwind: "$maid",
      },

      // Maid Auth
      {
        $lookup: {
          from: "auths",
          localField: "maid.auth",
          foreignField: "_id",
          as: "maidAuth",
        },
      },
      {
        $unwind: "$maidAuth",
      },

      {
        $project: {
          _id: 1,
          serviceDate: 1,
          serviceTime: 1,
          address: 1,
          notes: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,

          customer: {
            _id: "$customer._id",
            name: "$customerAuth.name",
            email: "$customerAuth.email",
            phone: "$customer.phone",
            address: "$customer.address",
            profileImage: "$customer.profileImage",
          },

          maid: {
            _id: "$maid._id",
            name: "$maidAuth.name",
            email: "$maidAuth.email",
            phone: "$maid.phone",
            address: "$maid.address",
            profileImage: "$maid.profileImage",
            experience: "$maid.experience",
            salary: "$maid.salary",
            skills: "$maid.skills",
            rating: "$maid.rating",
            totalReviews: "$maid.totalReviews",
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Maid Profile
    const maid = await MaidModel.findOne({
      auth: req.user.id,
    });

    if (!maid) {
      return res.status(404).json({
        success: false,
        message: "Maid profile not found.",
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

    // Authorization Check
    if (booking.maid.toString() !== maid._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to complete this booking.",
      });
    }

    // Booking Status Validation
    if (booking.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Booking is already completed.",
      });
    }

    if (booking.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected booking cannot be completed.",
      });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled booking cannot be completed.",
      });
    }

    if (booking.status !== "Accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted bookings can be completed.",
      });
    }

    // Update Booking
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      id,
      {
        status: "Completed",
      },
      {
        new: true,
      }
    );

    // Maid Available Again
    await MaidModel.findByIdAndUpdate(maid._id, {
      availability: true,
    });

    return res.status(200).json({
      success: true,
      message: "Booking completed successfully.",
      data: updatedBooking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Ownership Check
    if (booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking.",
      });
    }

    // Status Validation
    if (booking.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled.",
      });
    }

    if (booking.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed booking cannot be cancelled.",
      });
    }

    if (booking.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected booking cannot be cancelled.",
      });
    }

    // Cancel Booking
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      id,
      {
        status: "Cancelled",
      },
      {
        new: true,
      }
    );

    // If booking was accepted, make maid available again
    if (booking.status === "Accepted") {
      await MaidModel.findByIdAndUpdate(booking.maid, {
        availability: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: updatedBooking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};