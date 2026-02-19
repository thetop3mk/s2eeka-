const express = require("express");
const app = express();

// يخلي السيرفر يقرأ ملفات HTML و CSS
app.use(express.static("public"));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// مهم لـ Vercel
module.exports = app;
