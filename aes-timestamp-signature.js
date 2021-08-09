const express = require("express");
const {json} = require("body-parser");
const http = require("http");
const CryptoJs = require("crypto-js");
const {createDecipheriv} = require("crypto");
const app = express();

app.use(json());

const url = "http://localhost:2222/api/webhook";
const SECRET_KEY = "lytuan99lytuan99lytuan99lytuan99";
const initVector = "asdfghjklqwertyu";
const algorithm = "aes-256-cbc";

const verifyNaiviSignature = (req, res, next) => {
  const encryptedData = req.headers["naivi-signature"];
  const decipher = createDecipheriv(algorithm, SECRET_KEY, initVector);
  let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
  decryptedData += decipher.final("utf8");
  console.log("cipher String: ", decryptedData);

  const [times, sig] = decryptedData.split(",");
  const [tKey, timestamp] = times.split("=");
  const [al, signature] = sig.split("=");
  console.log(`${tKey}: ${timestamp}`);
  console.log(`${al}: ${signature}`);

  return next();
};

app.get("/api/webhook", (req, res) => {
  const algorithm = "aes-256-cbc";
  const VERIFY_TOKEN = "lytuan99lytuan99lytuan99lytuan99";
  const {mode, verifyToken, expectation} = req.query;
  if (mode && verifyToken) {
    if (mode === "subscribe" && verifyToken === VERIFY_TOKEN) {
      console.log("WEBHOOK IS VERIFIED");
      return res.status(200).send(expectation);
    }
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
});

app.post("/api/webhook", verifyNaiviSignature, (req, res) => {
  const data = req.body;

  console.log("post webhook: ", data);
  return res.send({status: 1});
});

const server = http.createServer(app);

server.listen(2222, () => {
  console.log("connected to server in port 2222");
});
