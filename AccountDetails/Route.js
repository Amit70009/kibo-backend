var express = require("express");
var userRouter = express.Router();
var AgentController = require("./Controller");
var mongoose = require("mongoose");

userRouter.post("/account-create", async (req, res) => {
    var accountData = await AgentController.CreateAccount();
    const createdAccounts = Array.isArray(accountData.data.allData) ? accountData.data.allData.slice(0, 10) : [];
    res.send({
        status: accountData.status,
        message: accountData.message,
        data: createdAccounts
    })
})

module.exports = userRouter