var express = require("express");
var userRouter = express.Router();
var AgentController = require("./Controller");
var mongoose = require("mongoose");

userRouter.post("/account-create", async (req, res) => {
    var accountData = await AgentController.CreateAccount();
    res.send({
        status: accountData.status,
        message: accountData.message,
        data: accountData.data
    })
})

module.exports = userRouter