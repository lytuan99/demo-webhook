# Demo-webhook
### Hướng dẫn tích hợp webhook vào Livechat

*Để đăng ký một webhook cho ứng dụng để có thể nhận các sự kiện từ hệ thống, mã nguồn của bạn phải được tổ chức trên một server **HTTPS** công khai chấp nhận các request **GET** và **POST**.*
#### Các bước dưới đây hướng dẫn bạn cách viết mã nguồn để đăng ký webhook từ chúng tôi bằng ngôn ngữ javascript.
***
##### 1. Tạo HTTP server lắng nghe webhook

```php
const express = require("express");
const {json} = require("body-parser");
const http = require("http");
const {createHmac, createHash} = require("crypto");
const app = express();
 
app.use(
 json({
   verify: (req, res, buf) => {
     req.rawBody = buf;
   },
 })
);

// Server demo 
const server = http.createServer(app);
 
server.listen(process.env.PORT || 2222, () => {
 console.log("webhook is listening");
});

```
Đoạn code trên tạo một HTTP server lắng nghe requests tại một cổng mặc định hoặc cổng 2222. Đoạn hướng dẫn này dùng framework ExpressJs, bạn có thể dùng bất kỳ framework nào để xây dựng webhook của bạn.

```php
// copy secret_key from app
const SECRET_KEY = "";
```

##### 2. Tạo webhook verification support

```php
// this endpoint is verification support
app.get("/api/webhook", (req, res) => {
  const {mode, verifyToken, expectation} = req.query;

  // get hashed secret key to  verify webhook
  const hashedSecretKey = createHash("sha1").update(SECRET_KEY).digest("hex");

  // Checks if a verifyToken and mode is in the query string of the request
  if (mode && verifyToken) {
    // Check mode and verifyToken is correct
    if (mode === "subscribe" && verifyToken === hashedSecretKey) {
      console.log("WEBHOOK IS VERIFIED");
      // Responds with the expectation token from the request
      return res.status(200).send(expectation);
    }
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
});

```
Đoạn code trên là quá trình xác thực webhook của bạn, nó giúp chúng tôi đảm bảo webhook của bạn được xác nhận và đang hoạt động.
Quá trình xác thực trên như sau:
* Bạn lấy secretKey của ứng dụng  từ màn hình tích hợp webhook của chúng tôi về, băm nó với mã sha1
* Bạn dùng mã vừa băm để so sánh với verifyToken mà chúng tôi gửi tới api verify webhook của bạn.
* Nếu khớp, bạn trả về HTTP 200 OK và expectation mà chúng tôi gửi tới bạn trong query.

##### 3. Tạo webhook endpoint

```php

// create the endpoint for our webhook
app.post("/api/webhook", verifySignature, (req, res) => {
 const data = req.body;
 // Do your work
 console.log("post webhook: ", data);
 return res.send({status: 1});
});

```
Đoạn code này tạo một /webhook endpoint chấp các request có phương thức POST, đây là endpoint mà Livechat gửi các tin nhắn sự kiện tới webhook của bạn.

##### 3. Verify Signature
*Phương thức verify signature để tăng độ tin cậy và bảo mật, bạn có thể áp dụng hoặc không.*
```php
const verifySignature = (req, res, next) => {
  // get signature
  const [algorithm, signature] = req.headers["x-smd-signature"].split("=");

  // hash body
  const hash = createHmac("sha256", SECRET_KEY)
    .update(req.rawBody) // JSON.stringify(req.body)
    .digest("hex");

  // compare
  if (hash === signature) return next();
  throw new Error("not verify");
};

```



