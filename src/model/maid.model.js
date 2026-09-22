
import mongoose ,{Schema, model} from "mongoose"
const maidSchema  = new Schema({
    auth:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Auth",
      required:true,
      unique:true
    },
    phone: {
      type: String,
    },

    address: {
      type: String,
    },

    experience: {
      type: Number,
      default: 0,
    },

    salary: {
      type: Number,
    },

    skills: [
      {
        type: String,
      },
    ],

    availability: {
      type: Boolean,
      default: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
},{timestamps:true})

const MaidModel = model("Maid",maidSchema)

export default MaidModel

