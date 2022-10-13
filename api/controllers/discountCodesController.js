const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");
const errorHandler = require("../middlewares/errorHandler");

const get_all_discountCodes = async (req, res) => {
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
      `select * from discount_codes order by id desc`
    );
    res.status(200).json(result1);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const create_discountCode = async (req, res) => {
  const { title, percent } = req.body.data;
  if (!title || !percent)
    return res
      .status(400)
      .json({ message: "مشخصات ارسالی جهت ثبت کد تخفیف ناقص می باشد" });

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
    // check for duplicate title in the db
    const [result1, fields1] = await connection.execute(
      `select count(*) as count from discount_codes where title='${title}'`
    );

    if (result1[0].count !== 0)
      return res.status(409).json({ message: "این عنوان قبلا وارد شده است" });

    const [result2, fields2] = await connection.execute(
      `insert into discount_codes (title, percent) values('${title}', '${percent}')`
    );

    res.status(201).json({ message: `کد تخفیف ی مورد نظر با موفقیت ثبت شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const delete_discountCode = async (req, res) => {
  const id = req.body.id;

  if (!id) return res.status(400).json({ message: "آیدی کد تخفیف نیاز است" });

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
      `select count(*) as count from discount_codes where id = ${id}`
    );

    if (result1[0].count === 0)
      return res
        .status(400)
        .json({ message: "کد تخفیفی مطابق با آیدی ارسالی وجود ندارد" });

    const [result6, fields6] = await connection.execute(
      `delete from discount_codes where id = ${id}`
    );

    res.status(200).json({ message: `کد تخفیف مورد نظر با موفقیت حذف شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

module.exports = {
  get_all_discountCodes,
  create_discountCode,
  delete_discountCode,
};
