var express = require("express");
var userRouter = express.Router();
var UserController = require("../Ticket/Controller");
var mongoose = require("mongoose");

userRouter.post("/ticket-create", async (req, res) => {
    var callLoginMethod = await UserController.Ticket();
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: callLoginMethod.data
    })
})

module.exports = userRouter