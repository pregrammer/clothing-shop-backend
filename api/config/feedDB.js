/*
/////////////////////////////////////////////// field_of_studies
const mysql = require("mysql2/promise");
const dbConfig = require("./api/config/dbConfig");
app.get("/", async (req, res) => {

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  for (let i = 1; i < 59; i++) {
    const name = i + "مهندسی کامپیوتر";
    const query = `insert into field_of_studies (name) values ('${name}')`;

    try {
      const [result2, fields2] = await connection.execute(query);      
    } catch (error) {
      return res
        .status(500)
        .json({ message: "خطا در اجرای دستور در پایگاه داده" });
    }
  }

  connection.end();
  res.status(201).send({ message: `رشته ها با موفقیت ثبت شدند` });
});

/////////////////////////////////////////////// users
const mysql = require("mysql2/promise");
const dbConfig = require("./api/config/dbConfig");
const bcrypt = require("bcrypt");
app.get("/", async (req, res) => {

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "خطا در برقراری ارتباط با پایگاه داده" });
  }

  for (let i = 1; i < 59; i++) {
    const pwd = 'aa11' + i;
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const last_two_phoneNumber = Math.floor(Math.random() * (100 - 10)) + 10;
    const query = `insert into users (email, password, firstName, lastName, phoneNumber, role, field_of_study_id) values ('ali@yahoo.com${i}', '${hashedPwd}', 'ali${i}', 'hosseini${i}', '091545879${last_two_phoneNumber}', ${Math.floor(Math.random() * 4) + 1}, ${Math.floor(Math.random() * (58)) + 1})`;

    try {
      const [result2, fields2] = await connection.execute(query);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "خطا در اجرای دستور در پایگاه داده" });
    }
  }

  connection.end();
  res.status(201).send({ message: `کاربران با موفقیت ثبت شدند` });
});


*/




/* integer semantic values stored in database

user:
  role = 1 (admin) || 2 (user).

*/


