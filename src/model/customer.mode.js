import mongoose,{Schema,model} from "mongoose"
const customerSchema  = new Schema({
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

    profileImage: {
      type: String,
      default: "",
    }
},{timestamps:true})

const CustomerModel = model("Customer",customerSchema)

export default CustomerModel

