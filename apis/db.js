require("dotenv").config();
const mongoose = require("mongoose");
const Logger = require("../services/logger");

// const uri = process.env.DB_URL;

mongoose.connect("mongodb+srv://nanday:Rahmi@cluster12.0deiebf.mongodb.net/", { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", (err) => Logger.error("db connection error: ", err));
db.once("open", function () {});

module.exports = db;
