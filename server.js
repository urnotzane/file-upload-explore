const express = require("express");
const app = express();
const fs = require("fs");

const port = 3000;
const host = "127.0.0.1";

// 托管静态文件，HTML文件在这个文件夹里
app.use(express.static("public"));

// 文件上传的api地址
app.post("/upload", function (req, res) {
  let file = null;
  req.on("data", (buffer) => {
    file = buffer;
  });

  req.on("end", () => {
    // 将数据变成string类型
    file.toString();
    // 从传来的数存进test的文件里
    fs.createWriteStream("test").write(file);
    // 返回上传结果
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("上传完成");
  });
});

app.listen(port, host, () => {
  console.log(`http://${host}:${port}`);
});
