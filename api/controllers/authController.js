const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");
const errorHandler = require("../middlewares/errorHandler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleRegister = async (req, res) => {
  const { email, password } = req.body.data;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ثبت کاربر ناقص است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  try {
    // check for duplicate email in the db
    const [result1, fields1] = await connection.execute(
      `select count(*) as count from users where email='${email}'`
    );

    if (result1[0].count !== 0)
      return res
        .status(409)
        .json({ message: "این ایمیل قبلا برای کاربر دیگری وارد شده است" });

    const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    //encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);

    const [result2, fields2] = await connection.execute(
      `insert into users (email, password, refreshToken) values ('${email}', '${hashedPwd}', '${refreshToken}')`
    );

    const accessToken = jwt.sign(
      {
        UserInfo: { id: result2.insertId, role: 1 },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Creates Secure Cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    }); // one day: 24 * 60 * 60 * 1000

    res.status(201).json({ accessToken });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body.data;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ورود کاربر ناقص است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  try {
    // check for existing email in the db
    const [result1, fields1] = await connection.execute(
      `select * from users where email='${email}'`
    );

    if (result1.length === 0)
      return res.status(401).json({ message: "ورود نامعتبر" }); //Unauthorized

    if (result1[0].state !== 1)
      return res.status(401).json({ message: "شما به حالت تعلیق درآمده اید" }); //user blocked by admin

    // evaluate password
    const match = await bcrypt.compare(password, result1[0].password);
    if (match) {
      // create JWTs
      const accessToken = jwt.sign(
        {
          UserInfo: { id: result1[0].id, role: result1[0].role },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { email: result1[0].email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      // Update refreshToken with current user
      const [result2, fields2] = await connection.execute(
        `update users set refreshToken = '${refreshToken}' where email = '${email}'`
      );

      // Creates Secure Cookie with refresh token
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      }); // one day: 24 * 60 * 60 * 1000

      // Send authorization access token to user
      res.json({ accessToken, role: result1[0].role });
    } else {
      res.status(401).json({ message: "ورود نامعتبر" });
    }
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  try {
    // check for existing refreshToken in the db
    const [result1, fields1] = await connection.execute(
      `select * from users where refreshToken='${refreshToken}'`
    );

    if (result1.length === 0) return res.sendStatus(403); //Forbidden

    // evaluate jwt
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err || result1[0].email !== decoded.email)
          return res.sendStatus(403);

        const accessToken = jwt.sign(
          {
            UserInfo: { id: result1[0].id, role: result1[0].role },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" }
        );
        res.json({ accessToken });
      }
    );
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const handleLogout = async (req, res) => {
  // On client, also delete the accessToken
  const cookies = req.cookies;
  if (!cookies?.jwt)
    return res.status(200).json({ message: "با موفقیت خارج شدید" }); //No content
  const refreshToken = cookies.jwt;

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  try {
    // check for existing refreshToken in the db
    const [result1, fields1] = await connection.execute(
      `select id from users where refreshToken='${refreshToken}'`
    );

    if (result1.length === 0) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      return res.status(200).json({ message: "با موفقیت خارج شدید" });
    }

    // Delete refreshToken in db
    const [result2, fields2] = await connection.execute(
      `update users set refreshToken = null where id = '${result1[0].id}'`
    );

    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    res.status(200).json({ message: "با موفقیت خارج شدید" });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

module.exports = {
  handleRegister,
  handleLogin,
  handleRefreshToken,
  handleLogout,
};
