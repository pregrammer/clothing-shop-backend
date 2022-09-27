const { logEvents } = require("./logEvents");

const errorHandler = (err, req, res, next, isSql) => {
  logEvents(`${err.name}: ${err.message}`, "errLog.txt");
  console.log(err);
  if (isSql) {
    res.status(500).json({ message: "خطا در اجرای دستور در پایگاه داده" });
  } else {
    res.status(500).json({ message: err.message });
  }
};

module.exports = errorHandler;
