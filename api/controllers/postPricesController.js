const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");
const errorHandler = require("../middlewares/errorHandler");

const get_all_postPrices = async (req, res) => {
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
      `select * from post_prices order by id desc`
    );
    res.status(200).json(result1);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const create_postPrice = async (req, res) => {
  const { title, price } = req.body.data;
  if (!title || !price)
    return res
      .status(400)
      .json({ message: "مشخصات ارسالی جهت ثبت قیمت پست ناقص می باشد" });

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
      `select count(*) as count from post_prices where title='${title}'`
    );

    if (result1[0].count !== 0)
      return res.status(409).json({ message: "این عنوان قبلا وارد شده است" });

    const [result2, fields2] = await connection.execute(
      `insert into post_prices (title, price) values('${title}', '${price}')`
    );

    res.status(201).json({ message: `قیمت پست مورد نظر با موفقیت ثبت شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const delete_postPrice = async (req, res) => {
  const id = req.body.id;

  if (!id) return res.status(400).json({ message: "آیدی قیمت پست نیاز است" });

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
      `select count(*) as count from post_prices where id = ${id}`
    );

    if (result1[0].count === 0)
      return res
        .status(400)
        .json({ message: "قیمت پستی مطابق با آیدی ارسالی وجود ندارد" });

    const [result6, fields6] = await connection.execute(
      `delete from post_prices where id = ${id}`
    );

    res.status(200).json({ message: `قیمت پست مورد نظر با موفقیت حذف شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

module.exports = {
  get_all_postPrices,
  create_postPrice,
  delete_postPrice,
};
