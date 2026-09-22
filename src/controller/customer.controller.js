import CustomerModel from "../model/customer.mode.js";
export const getCustomerProfile = async (req, res) => {
  try {
 
    const profile = await CustomerModel.findOne({
      auth: req.user.id,
    }).populate("auth", "name email role");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCustomerProfile = async (req, res) => {
  try {
    const { phone, address, profileImage } = req.body;

    const profile = await CustomerModel.findOneAndUpdate(
      { auth: req.user.id },
      {
        auth: req.user.id, // 👈 important for upsert
        phone,
        address, 
        profileImage,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      profile,
    });
  }
  catch(error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};