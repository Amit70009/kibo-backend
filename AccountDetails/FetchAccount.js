var express = require("express");
var userRouter = express.Router();
var fetchAccount = require("./Controller");
var mongoose = require("mongoose");

userRouter.get("/fetch-all-account", async (req, res) => {
   
    var FetchAccount = await fetchAccount.GetAllAccount();
    res.send({
        status: FetchAccount.status,
        message: FetchAccount.message,
        data: FetchAccount.data
    })
})

module.exports = userRouter
