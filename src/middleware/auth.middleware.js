import jwt from "jsonwebtoken"

 export const verifyToken = (req, res, next) => {
  try {
    // Authorization: Bearer eyJhbGc...
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token not found"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECREAT_KEY);

    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid Token"
    });
  }
};


 export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
  console.log(req.user.role)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied"
      });
    }

    next();
  };
};
