import {Schema,model} from "mongoose";
import bcrypt from "bcrypt";

const authSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["customer", "maid"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash Password
authSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) {
      return ;
    }

    this.password = await bcrypt.hash(this.password, 12);


  } catch (error) {
    return
  }
});



const AuthModel = model("Auth", authSchema)

export default AuthModel