const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const errorHandler = require("../middlewares/errorHandler");

const get_all_products = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  if (!page || !limit)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ذریافت محصولات ناقص است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }
  const startIndex = (page - 1) * limit;
  const results = {};

  try {
    const [result2, fields2] = await connection.execute(
      `select count(*) as count from products`
    );
    results.totallItems = result2[0].count;

    const [result3, fields3] = await connection.execute(
      `select * from products order by id desc limit ${limit} OFFSET ${startIndex}`
    );

    const result = [];
    for (let i = 0; i < result3.length; i++) {
      const [result4, fields4] = await connection.query(
        `select title, feature from product_features where product_id=${result3[i].id};
        select size, inventory from product_inventories where product_id=${result3[i].id}`
      );
      result.push({
        ...result3[i],
        features: result4[0],
        inventories: result4[1],
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

const get_filtered_products = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const kinds = req.query.kinds;
  if (!page || !limit || !kinds)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای دریافت محصولات ناقص است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }
  const startIndex = (page - 1) * limit;
  const results = {};

  const sql_kind = Array.isArray(kinds)
    ? kinds.map((kind) => `kind='${kind}'`).join(" or ")
    : `kind = '${kinds}'`;
  const where_clause = kinds.includes("all") ? "" : ` where ${sql_kind}`;

  try {
    const [result2, fields2] = await connection.execute(
      `select count(*) as count from products${where_clause}`
    );
    results.totallItems = result2[0].count;

    const [result3, fields3] = await connection.execute(
      `select * from products${where_clause} order by id desc limit ${limit} OFFSET ${startIndex}`
    );

    const result = [];
    for (let i = 0; i < result3.length; i++) {
      const [result4, fields4] = await connection.query(
        `select image_url from product_images where product_id=${result3[i].id};
        select inventory from product_inventories where product_id=${result3[i].id}`
      );
      result.push({
        ...result3[i],
        image_url: result4[0][0].image_url, // get first image_url
        in_stock: result4[1].some((inv) => inv.inventory > 0),
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

const get_products_for_index = async (req, res) => {
  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  try {
    const [result1, fields1] = await connection.execute(
      `select * from products order by id desc limit 9`
    );

    const result = [];
    for (let i = 0; i < result1.length; i++) {
      const [result2, fields2] = await connection.query(
        `select image_url from product_images where product_id=${result1[i].id};
        select inventory from product_inventories where product_id=${result1[i].id}`
      );
      result.push({
        ...result1[i],
        image_url: result2[0][0].image_url, // get first image_url
        in_stock: result2[1].some((inv) => inv.inventory > 0),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const get_products_ids = async (req, res) => {
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
      `select id from products`
    );

    const ids = result1.map((res) => res.id);

    res.status(200).json(ids);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const get_cart_products = async (req, res) => {
  const ids = JSON.parse(req.query.ids);
  const payment = req.query.payment;
  if (!ids)
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ذریافت محصولات ناقص است" });

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
    if (payment === "active") {
      const where_clause =
        "where " + ids.map((id) => `id = ${id}`).join(" or ");
      const [result, fields] = await connection.execute(
        `select * from products ${where_clause}`
      );
      return res.status(200).json(result);
    }

    const where_clause1 =
      "where " + ids.map((id) => `id = ${id.product_id}`).join(" or ");
    const where_clause2 =
      "where " + ids.map((id) => `id = ${id.inventory_id}`).join(" or ");

    const [result1, fields1] = await connection.execute(
      `select * from products ${where_clause1}`
    );

    const [result2, fields2] = await connection.execute(
      `select * from product_inventories ${where_clause2}`
    );

    const result = result1.map((prod) => {
      const product_inventory = result2.filter(
        (inv) => inv.product_id === prod.id
      )[0];
      return {
        ...prod,
        product_inventory,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const get_product = async (req, res) => {
  const id = parseInt(req.params.id);

  if (!id) return res.status(400).json({ message: "آیدی محصول نیاز است" });

  //connect to db
  let connection;
  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  try {
    const [result1, fields1] = await connection.execute(
      `select * from products where id = ${id}`
    );

    if (result1.length === 0)
      return res.status(409).json({ message: "محصولی با این آیدی وجود ندارد" });

    const [result2, fields2] = await connection.query(
      `select image_url from product_images where product_id=${id};
        select id, title, feature from product_features where product_id=${id};
        select id, size, inventory from product_inventories where product_id=${id}`
    );
    const result = {
      ...result1[0],
      images: result2[0],
      features: result2[1],
      inventories: result2[2],
    };

    res.status(200).json(result);
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const create_product = async (req, res) => {
  const { name, price, discount, kind, features, inventories } = req.body.data;
  const { images } = req.files.data;
  if (
    !name ||
    !price ||
    !kind ||
    discount === undefined ||
    !Array.isArray(features) ||
    features?.length === 0 ||
    !Array.isArray(inventories) ||
    inventories?.length === 0 ||
    !Array.isArray(images) ||
    images?.length === 0
  )
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ثبت محصول ناقص است" });

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
    // check for duplicate name in the db
    const [result1, fields1] = await connection.execute(
      `select count(*) as count from products where name='${name}'`
    );

    if (result1[0].count !== 0)
      return res.status(409).json({ message: "نام محصول تکراری است" });

    await connection.beginTransaction();

    const [result2, fields2] = await connection.execute(
      `insert into products (name, price, discount, kind) values('${name}', '${price}', '${discount}', '${kind}')`
    );

    const product_id = result2.insertId;

    features.forEach(async (f) => {
      const [result3, fields3] = await connection.execute(
        `insert into product_features (title, feature, product_id) values('${f.title}', '${f.feature}', ${product_id})`
      );
    });
    inventories.forEach(async (i) => {
      const [result4, fields4] = await connection.execute(
        `insert into product_inventories (size, inventory, product_id) values('${i.size}', '${i.inventory}', ${product_id})`
      );
    });
    const image_urls = [];

    // create folder with product name.
    const folderName = name.split(" ").join("-");
    if (
      !fs.existsSync(
        path.join(__dirname, "../public/images/products", folderName)
      )
    ) {
      await fsPromises.mkdir(
        path.join(__dirname, "../public/images/products", folderName)
      );
    }

    // move images to public folder and push image urls for inserting in db.
    images.forEach((img, i) => {
      img.mv(
        path.join(
          __dirname,
          `../public/images/products/${folderName}/`,
          `${i + 1}-${img.name}`
        )
      );
      image_urls.push(
        `http://localhost:3500/static/images/products/${folderName}/${i + 1}-${
          img.name
        }`
      );
    });

    image_urls.forEach(async (image_url) => {
      const [result5, fields5] = await connection.execute(
        `insert into product_images (image_url, product_id) values('${image_url}', ${product_id})`
      );
    });

    await connection.commit();
    res.status(201).json({ message: `محصول مورد نظر با موفقیت ثبت شد` });
  } catch (error) {
    connection.rollback();
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const update_product = async (req, res) => {
  const { id, name, price, discount, kind, features, inventories } =
    req.body.data;
  const images = req.files?.data?.images;
  if (
    !name ||
    !price ||
    !kind ||
    discount === undefined ||
    !Array.isArray(features) ||
    features?.length === 0 ||
    !Array.isArray(inventories) ||
    inventories?.length === 0
  )
    return res
      .status(400)
      .json({ message: "اطلاعات ارسالی برای ویرایش محصول ناقص است" });

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
    // check for duplicate name in the db
    const [result1, fields1] = await connection.execute(
      `select count(*) as count from products where name='${name}'`
    );
    // one is for current product.
    if (result1[0].count > 1)
      return res.status(409).json({ message: "نام محصول تکراری است" });

    await connection.beginTransaction();

    // get old product's name.
    const [result5, fields5] = await connection.execute(
      `select name from products where id='${id}'`
    );

    const [result2, fields2] = await connection.execute(
      `update products set name='${name}', price='${price}', discount='${discount}', kind='${kind}' where id = ${id}`
    );

    const [result22, fields22] = await connection.execute(
      `delete from product_features where product_id = ${id}`
    );
    features.forEach(async (f) => {
      const [result3, fields3] = await connection.execute(
        `insert into product_features (title, feature, product_id) values('${f.title}', '${f.feature}', ${id})`
      );
    });

    const [result33, fields33] = await connection.execute(
      `delete from product_inventories where product_id = ${id}`
    );
    inventories.forEach(async (i) => {
      const [result4, fields4] = await connection.execute(
        `insert into product_inventories (size, inventory, product_id) values('${i.size}', '${i.inventory}', ${id})`
      );
    });

    const oldFolderName = result5[0].name.split(" ").join("-");
    const newFolderName = name.split(" ").join("-");

    // if we have new images.
    if (images?.length) {
      // delete old folder of images.
      await fsPromises.rm(
        path.join(__dirname, "../public/images/products", oldFolderName),
        { recursive: true, force: true } // delete whatever inside folder (images).
      );

      const [result6, fields6] = await connection.execute(
        `delete from product_images where product_id = ${id}`
      );

      const image_urls = [];
      // create folder with new product name.
      if (
        !fs.existsSync(
          path.join(__dirname, "../public/images/products", newFolderName)
        )
      ) {
        await fsPromises.mkdir(
          path.join(__dirname, "../public/images/products", newFolderName)
        );
      }

      // move images to public folder and push image_urls array for inserting in db.
      images.forEach((img, i) => {
        img.mv(
          path.join(
            __dirname,
            `../public/images/products/${newFolderName}/`,
            `${i + 1}-${img.name}`
          )
        );
        image_urls.push(
          `http://localhost:3500/static/images/products/${newFolderName}/${
            i + 1
          }-${img.name}`
        );
      });

      image_urls.forEach(async (image_url) => {
        const [result7, fields7] = await connection.execute(
          `insert into product_images (image_url, product_id) values('${image_url}', ${id})`
        );
      });
    } else {
      if (oldFolderName !== newFolderName) {
        await fsPromises.rename(
          path.join(__dirname, "../public/images/products", oldFolderName),
          path.join(__dirname, "../public/images/products", newFolderName)
        );
        const image_urls = [];
        const folderPath = path.join(
          __dirname,
          "../public/images/products",
          newFolderName
        );
        const files = await fsPromises.readdir(folderPath);
        files.forEach((fileName) => {
          image_urls.push(
            `http://localhost:3500/static/images/products/${newFolderName}/${fileName}`
          );
        });
        const [result8, fields8] = await connection.execute(
          `delete from product_images where product_id=${id}`
        );
        image_urls.forEach(async (image_url) => {
          const [result9, fields9] = await connection.execute(
            `insert into product_images (image_url, product_id) values('${image_url}', ${id})`
          );
        });
      }
    }

    await connection.commit();
    res.status(201).json({ message: `محصول مورد نظر با موفقیت ویرایش شد` });
  } catch (error) {
    connection.rollback();
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

const delete_product = async (req, res) => {
  const { id, name } = req.body;

  if ((!id, !name))
    return res.status(400).json({ message: "مشخصات محصول ناقص است" });

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
      `select count(*) as count from products where id = ${id}`
    );

    if (result1[0].count === 0)
      return res
        .status(400)
        .json({ message: "محصولی مطابق با آیدی ارسالی وجود ندارد" });

    const [result2, fields2] = await connection.execute(
      `delete from products where id = ${id}`
    );

    // delete folder of images.
    const folderName = name.split(" ").join("-");
    await fsPromises.rm(
      path.join(__dirname, "../public/images/products", folderName),
      { recursive: true, force: true } // delete whatever inside folder (images).
    );

    res.status(200).json({ message: `محصول مورد نظر با موفقیت حذف شد` });
  } catch (error) {
    errorHandler(error, null, res, null, true);
  } finally {
    connection.end();
  }
};

module.exports = {
  get_all_products,
  get_filtered_products,
  get_products_for_index,
  get_products_ids,
  get_cart_products,
  get_product,
  create_product,
  update_product,
  delete_product,
};

/*
product kinds:
1- clothes
2- pants
3- shoes
4- men_accessory
5- women_accessory
*/
