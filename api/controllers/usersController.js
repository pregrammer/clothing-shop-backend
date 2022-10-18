const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const errorHandler = require("../middlewares/errorHandler");

const get_user = async (req, res) => {
  const id = req.query.id;
  let user_id;
  if (id && req.user.role === 2) {
    user_id = Number(id);
  } else {
    user_id = req.user.id;
  }
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
    const [result1, fields1] = await connection.execute(
      `select email, fullName, phoneNumber, postalCode, address from users where id = ${user_id}`
    );
    if (result1.length !== 0) {
      const user = {
        email: result1[0].email,
        firstName: result1[0].fullName?.split(" ")[0],
        lastName: result1[0].fullName?.split(" ")[1],
        phoneNumber: result1[0].phoneNumber,
        postalCode: result1[0].postalCode,
        address: result1[0].address,
      };
      return res.status(200).json({ user });
    } else {
      return res.status(400).json({ message: "کاربری یافت نشد" });
    }
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const get_all_users = async (req, res) => {
  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  if (!page || !limit)
    return res.status(400).json({ message: "specify page and limit" });

  const startIndex = (page - 1) * limit;

  const results = {};

  try {
    const [result1, fields1] = await connection.execute(
      "select count(*) as count from users"
    );
    results.totallItems = result1[0].count - 1; // we dont count admin

    const [result2, fields2] = await connection.execute(
      `select id, email, fullName, state, phoneNumber, created_at from users 
      where id <> ${req.user.id} order by id desc limit ${limit} OFFSET ${startIndex}`
    );
    results.result = result2;
    res.status(200).json(results);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const update_user = async (req, res) => {
  const { email, fullName, phoneNumber, postalCode, address, password } =
    req.body.data;
  if (
    !email ||
    fullName === undefined ||
    postalCode === undefined ||
    phoneNumber === undefined ||
    address === undefined
  )
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ویرایش ناقص است" });

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
    // check for existing id in the db
    const [result0, fields0] = await connection.execute(
      `select count(*) as count from users where id = ${req.user.id}`
    );

    if (result0[0].count === 0)
      return res
        .status(400)
        .json({ message: "کاربری مطابق با مشخصات ارسالی وجود ندارد" });

    // check for duplicate email in the db
    const [result1, fields1] = await connection.execute(
      `select count(*) as count from users where email='${email}' and id <> ${req.user.id}`
    );

    if (result1[0].count !== 0)
      return res
        .status(409)
        .json({ message: "این ایمیل قبلا برای کاربر دیگری وارد شده است" });

    //encrypt the password
    let hashedPwd;
    if (password !== "") {
      hashedPwd = await bcrypt.hash(password, 10);
    }

    // maybe user don't want to change their password
    // only admin can change fos and role
    const [result2, fields2] = await connection.execute(
      `update users set email = '${email}'${
        hashedPwd ? `, password = '${hashedPwd}'` : ""
      }, 
      fullName = '${fullName}', address = '${address}', phoneNumber = '${phoneNumber}', postalCode = '${postalCode}' 
      where id = ${req.user.id}`
    );

    // you can regenerate jwt token here, or reLogin to update the jwt user_information.

    res.status(201).json({ message: `مشخصات کاربری با موفقیت ویرایش شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const change_user_state = async (req, res) => {
  const { id } = req.body.data;
  if (!id)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای تغییر وضعیت کاربر ناقص است" });

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
    // check for existing id in the db
    const [result1, fields1] = await connection.execute(
      `select state from users where id=${id}`
    );

    if (result1.length === 0)
      return res
        .status(400)
        .json({ message: "کاربری مطابق با آیدی ارسالی وجود ندارد" });

    if (result1[0].state === 1) {
      const [result2, fields2] = await connection.execute(
        `update users set state = 2 where id = ${id}`
      );
    } else {
      const [result2, fields2] = await connection.execute(
        `update users set state = 1 where id = ${id}`
      );
    }

    return res
      .status(201)
      .json({ message: `وضعیت کاربر مورد نظر با موفقیت تغییر پیدا کرد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const delete_user = async (req, res) => {
  const id = req.body.id;

  if (!id) return res.status(400).json({ message: "آیدی کاربر نیاز است" });

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
    // check for existing id in the db
    const [result1, fields1] = await connection.execute(
      `select count(*) as count from users where id = ${id}`
    );

    if (result1[0].count === 0)
      return res
        .status(400)
        .json({ message: "کاربری مطابق با آیدی ارسالی وجود ندارد" });

    const [result2, fields2] = await connection.execute(
      `delete from users where id = ${id}`
    );

    res.status(200).json({ message: `کاربر مورد نظر با موفقیت حذف شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

module.exports = {
  get_user,
  get_all_users,
  update_user,
  change_user_state,
  delete_user,
};
