import MaidModel from "../model/maid.model.js"
import mongoose from "mongoose";

export const getMaidDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Maid Id",
      });
    }

    const result = await MaidModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "auths", // MongoDB collection name
          localField: "auth",
          foreignField: "_id",
          as: "auth",
        },
      },
      {
        $unwind: {
          path: "$auth",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 1,
          phone: 1,
          address: 1,
          experience: 1,
          salary: 1,
          skills: 1,
          availability: 1,
          profileImage: 1,
          rating: 1,
          totalReviews: 1,
          createdAt: 1,
          updatedAt: 1,

          auth: {
            _id: "$auth._id",
            name: "$auth.name",
            email: "$auth.email",
            role: "$auth.role",
          },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Maid not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Maid details fetched successfully.",
      data: result[0],
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

export  const getMaids = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 16;
    const skip = (page - 1) * limit;

    const {
      search = "",
      skill,
      experience,
      availability,
      sort = "newest",
    } = req.query;

    const pipeline = [
      {
        $lookup: {
          from: "auths",
          localField: "auth",
          foreignField: "_id",
          as: "auth",
        },
      },
      {
        $unwind: "$auth",
      },
    ];

    // Search
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "auth.name": { $regex: search, $options: "i" } },
            { "auth.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Skill Filter
    if (skill) {
      pipeline.push({
        $match: {
          skills: skill,
        },
      });
    }

    // Experience Filter
    if (experience) {
      pipeline.push({
        $match: {
          experience: { $gte: Number(experience) },
        },
      });
    }

    // Availability Filter
    if (availability !== undefined) {
      pipeline.push({
        $match: {
          availability: availability === "true",
        },
      });
    }

    // Sorting
    let sortStage = { createdAt: -1 };

    if (sort === "salaryLow") {
      sortStage = { salary: 1 };
    } else if (sort === "salaryHigh") {
      sortStage = { salary: -1 };
    } else if (sort === "experience") {
      sortStage = { experience: -1 };
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              phone: 1,
              address: 1,
              experience: 1,
              salary: 1,
              skills: 1,
              availability: 1,
              profileImage: 1,
              rating: 1,
              totalReviews: 1,
              "auth.name": 1,
              "auth.email": 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await MaidModel.aggregate(pipeline);

    const maids = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      message: "Maids fetched successfully.",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: maids,
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

export const getMaidProfile = async (req, res) => {
  try {
    console.log(await MaidModel.find())
    const profile = await MaidModel.findOne({
      auth: req.user.id,
    }).populate("auth", "name email role");
     
    console.log(profile)
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
  } 
  catch(err)
  {
    console.log(err)
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateMaidProfile = async (req, res) => {
  try {
    const {
      phone,
      address,
      experience,
      salary,
      skills,
      availability,
      profileImage,
    } = req.body;

    const profile = await MaidModel.findOneAndUpdate(
      { auth: req.user.id },
      {
        auth: req.user.id, // 👈 important for upsert
        phone,
        address,
        experience,
        salary,
        skills,
        availability,
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};