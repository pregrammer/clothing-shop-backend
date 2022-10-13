// check user is "admin" or not
const isAdmin = (req, res, next) => {
  if (req.user.role === 2) {
    next();
  } else {
    return res.status(403).json({ message: "دسترسی غیر مجاز" });
  }
};

module.exports = {
  isAdmin,
};
