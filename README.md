# 文件上传过程探究

> 前端发展如此之快，使得业务开发无需学习底层原理，直接使用现成的框架或工具就可以直接进入开发，虽然这极大地提高了开发速度，但正所谓万变不离其宗，对于开发者来说理解其原理才会在技术上有长久稳定的发展，最近开发涉及到了文件上传相关的东西，想到自己平时开发都是直接用别人的SDK，原理和具体过程什么的都不了解，感觉迷迷糊糊莫名其妙的就把文件传上去了，可以说是两眼一抹黑了，本文就此次对文件上传的研究，做一些小小的记录。

## 疑问
* 文件是如何从计算机中取到的？
* 取到文件后浏览器端是如何保存文件的？
* 从前端到后端，文件是怎么从前端传给后端的？
* 传输给后端的数据到底是什么？

## 浏览器端做了什么

常见的文件上传的方法有form表单上传或input + Ajax上传，但这两种方法从前端方面来讲，其本质都是由input实现。
> 在 HTML 文档中`<input type="file">`标签每出现一次，一个 FileUpload 对象就会被创建。——[HTML DOM FileUpload 对象](https://www.w3school.com.cn/htmldom/dom_obj_fileupload.asp)

创建一个HTML文件内容如下：
```html
...
<form action="/upload" method="POST" enctype="multipart/form-data">
  <input
    onchange="handleChange(this)"
    type="file"
    name="file1"
    value="请选择文件"
  /><br />
  <input type="submit" />
</form>
...
```
然后我们将HTML中的input对象在控制台输出，会看到一个FileUpload对象：
![image.png](https://gallary.ithen.cn/images/2021/05/21/image.png)

这个对象里有个`files`的属性，保存的是File对象列表（FileList），是我们选择的所有文件，当没有指定`multiple`属性时，这个列表只有一个File对象。比如下面：
![imagecd4f61549a7d97a9.png](https://gallary.ithen.cn/images/2021/05/21/imagecd4f61549a7d97a9.png)

下面我们再写一个简单的node服务来实现文件上传的全过程。
```javascript
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
    // 将传来的数据存进test的文件里
    fs.createWriteStream("test").write(file);
    // 返回上传结果
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("上传完成");
  });
});

app.listen(port, host, () => {
  console.log(`http://${host}:${port}`);
});
```
## form表单上传
```html
<html>
  <head> </head>
  <body>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input
        onchange="handleChange(this)"
        type="file"
        name="file1"
        value="请选择文件"
      /><br />
      <input type="submit" />
    </form>
    <script>
      function handleChange(e) {
        console.log(e);
      }
    </script>
  </body>
</html>
```
### 属性设置
form表单上传文件需要设置form标签的以下几个属性：
```json
{
  "action": "/upload", // 上传地址
  "enctype": "multipart/form-data", // 上传文件的请求头
  "method": "POST", // 请求方法
}
```
### 上传文件
点击页面的input控件选择要上传的图片，此时input标签的FileUpload对象的files属性会多一个File对象，里面保存了刚刚选择的图片的信息，点击提交按钮，浏览器会发送一个POST请求并跳转至`action`属性设置的地址里，请求如下：
![1621825854788.jpg](https://gallary.ithen.cn/images/2021/05/24/1621825854788.jpg)
可以看到请求头Content-Type的内容有一个`boundary`的参数，它告诉服务端，请求体将以它的值来标记上传的各个文件的开始和结束。
### 接收并保存
在我们启动的这个简单的node服务中，我们将前端传过来的内容保存在了`test`文件中，打开这个文件：
![1621826026882.jpg](https://gallary.ithen.cn/images/2021/05/24/1621826026882.jpg)
可以看到我们选择的文件已经传给了服务端，最后结尾的`--`表示数据传输结束.

## Ajax上传
```html
<html>
  <head> </head>
  <body>
    <input
      id="input"
      onchange="handleChange(this)"
      type="file"
      name="file2"
      value="请选择文件"
    /><br />
    <button onclick="onSubmit()">提交</button>
    <script>
      function handleChange(e) {
        console.log(e);
      }
      function onSubmit() {
        const file = document.getElementById("input").files[0];
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append("file", file);
        xhr.open("POST", "/upload", true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4 && xhr.status == 200) {
            alert(xhr.responseText);
          }
        };

        xhr.send(fd);
      }
    </script>
  </body>
</html>
```
这种方式使用了`FormData`对象来实现：
> `FormData`接口提供了一种表示表单数据的键值对`key/value`的构造方式，并且可以轻松的将数据通过`XMLHttpRequest.send()`方法发送出去。——[FormData](https://developer.mozilla.org/zh-CN/docs/Web/API/FormData)

选择文件后点击提交按钮，会发送一个POST请求，而且页面不会发生跳转，请求如下：
![1621841803443.jpg](https://gallary.ithen.cn/images/2021/05/24/1621841803443.jpg)
其中请求里的FormData表示的就是刚刚通过FormData接口创建的对象。

它的接收和保存和form表单是一样的。

## 参考
* [揭秘前端文件上传原理（一）](https://blog.csdn.net/qq_27053493/article/details/100589143)