const jwt = require("jsonwebtoken");

const verifyIsLoggedIn = (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "A token is required for authentication" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid Token" });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyIsLoggedIn };
