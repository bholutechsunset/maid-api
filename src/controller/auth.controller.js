import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import AuthModal from "../model/auth.model.js";

 export const signup = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Role Validation
    if (!["customer", "maid"].includes(role)) {
      return res.status(400).json({
        message: "Invalid Role"
      });
    }

    
    const User = await AuthModal.findOne({ email });

    if (User)
    return res.status(400).json({message: "Email already exists"})

    const user = await AuthModal.create(req.body)

    res.json({message: "Signup Successful",user})

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};



 export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // User Find
    const user = await AuthModal.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Password Compare
    const isLogin = await bcrypt.compare(password, user.password);

    if (!isLogin) {
      return res.status(401).json({
        message: "Invalid Password"
      });
    }

    // JWT Generate
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECREAT_KEY,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      message: "Login Successfully",
      token
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: err.message
    });
  }
};


