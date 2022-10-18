const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");
const errorHandler = require("../middlewares/errorHandler");

const get_user_orders = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  if (!page || !limit)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ذریافت سفارشات ناقص است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }
  const startIndex = (page - 1) * limit;
  const results = {};

  try {
    const [result2, fields2] = await connection.execute(
      `select count(*) as count from orders where user_id=${req.user.id}`
    );
    results.totallItems = result2[0].count;

    const [result3, fields3] = await connection.execute(
      `select * from orders where user_id=${req.user.id} order by id desc limit ${limit} OFFSET ${startIndex}`
    );

    const result = [];
    for (let i = 0; i < result3.length; i++) {
      const [result4, fields4] = await connection.execute(
        `select * from order_products where order_id=${result3[i].id}`
      );
      result.push({
        ...result3[i],
        products: result4,
      });
    }

    results.result = result;
    res.status(200).json(results);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const get_users_orders = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  if (!page || !limit)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ذریافت سفارشات ناقص است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }
  const startIndex = (page - 1) * limit;
  const results = {};

  try {
    const [result2, fields2] = await connection.execute(
      `select count(*) as count from orders`
    );
    results.totallItems = result2[0].count;

    const [result3, fields3] = await connection.execute(
      `select * from orders order by id desc limit ${limit} OFFSET ${startIndex}`
    );

    const result = [];
    for (let i = 0; i < result3.length; i++) {
      const [result4, fields4] = await connection.execute(
        `select * from order_products where order_id=${result3[i].id}`
      );
      result.push({
        ...result3[i],
        products: result4,
      });
    }

    results.result = result;
    res.status(200).json(results);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const create_order = async (req, res) => {
  const {
    totallPrice,
    postKind,
    postPrice,
    discountCode,
    discountAmount,
    products,
  } = req.body.data;
  if (
    !totallPrice ||
    !postKind ||
    !postPrice ||
    discountCode === undefined ||
    discountAmount === undefined ||
    !Array.isArray(products) ||
    products?.length === 0
  )
    return res
      .status(400)
      .json({ message: "مشخصات ارسالی جهت ثبت سفارش ناقص می باشد" });

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
    await connection.beginTransaction();

    // check for enough products inventories
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      const [result1, fields1] = await connection.execute(
        `select inventory from product_inventories where id=${product.inventory_id}`
      );

      if (result1[0].inventory < product.count) {
        return res
          .status(409)
          .json({ message: `موجودی ${product.name} کافی نمی باشد` });
      } else {
        const [result11, fields11] = await connection.execute(
          `update product_inventories set inventory=${
            result1[0].inventory - product.count
          } where id=${product.inventory_id}`
        );
      }
    }

    const [result2, fields2] = await connection.execute(
      `insert into orders (totallPrice, postKind, postPrice, discountCode, discountAmount, user_id) 
      values('${totallPrice}', '${postKind}','${postPrice}', '${discountCode}','${discountAmount}', ${req.user.id})`
    );

    const order_id = result2.insertId;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      const [result3, fields3] = await connection.execute(
        `insert into order_products (name, price, discount, count, product_id, order_id) 
        values('${product.name}', '${product.price}','${product.discount}', '${product.count}','${product.id}','${order_id}')`
      );
    }

    await connection.commit();
    res.status(201).json({ message: `سفارش شما با موفقیت ثبت شد` });
  } catch (error) {
    connection.rollback();
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const change_order_state = async (req, res) => {
  const { id } = req.body.data;
  if (!id)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای تغییر وضعیت سفارش ناقص است" });

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
      `select state from orders where id=${id}`
    );

    if (result1.length === 0)
      return res
        .status(400)
        .json({ message: "سفارشی مطابق با آیدی ارسالی وجود ندارد" });

    if (result1[0].state === 1) {
      const [result2, fields2] = await connection.execute(
        `update orders set state = 2 where id = ${id}`
      );
    } else {
      const [result2, fields2] = await connection.execute(
        `update orders set state = 1 where id = ${id}`
      );
    }

    return res
      .status(201)
      .json({ message: `وضعیت سفارش مورد نظر با موفقیت تغییر پیدا کرد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const delete_order = async (req, res) => {
  const id = req.body.id;

  if (!id) return res.status(400).json({ message: "آیدی سفارش نیاز است" });

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
      `select count(*) as count from orders where id = ${id}`
    );

    if (result1[0].count === 0)
      return res
        .status(400)
        .json({ message: "سفارشی مطابق با آیدی ارسالی وجود ندارد" });

    const [result2, fields2] = await connection.execute(
      `delete from orders where id = ${id}`
    );

    res.status(200).json({ message: `سفارش مورد نظر با موفقیت حذف شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

module.exports = {
  get_user_orders,
  get_users_orders,
  create_order,
  change_order_state,
  delete_order,
};
