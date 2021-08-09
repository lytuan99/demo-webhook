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

// when test use ngrok refer to port 2222
const url = "http://localhost:2222/api/webhook";

// copy secret_key from app
const SECRET_KEY = "695c6541-bf7b-411a-949e-b3321774d39a";

const verifySignature = (req, res, next) => {
  // get signature
  const [algorithm, signature] = req.headers["x-smd-signature"].split("=");

  // hash body
  const hash = createHmac("sha256", SECRET_KEY)
    .update(`${req.rawBody}${req.body.timestamp}`)
    .digest("hex");

  // you can check timestamp here

  // compare
  if (hash === signature) return next();
  throw new Error("not verify");
};

// api verify webhook
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

// create the endpoint for our webhook
app.post("/api/webhook", verifySignature, (req, res) => {
  const data = req.body;

  console.log("post webhook: ", data);
  return res.send({status: 1});
});

// Server demo

const server = http.createServer(app);

server.listen(process.env.PORT || 2222, () => {
  console.log("webhook is listening");
});
