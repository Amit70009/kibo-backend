var express = require("express");
var userRouter = express.Router();
var UserController = require("../Ticket/Controller");
var mongoose = require("mongoose");

userRouter.get("/agent-name", async (req, res) => {
    var callLoginMethod = await UserController.AgentName();
    // console.log(callLoginMethod);
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: callLoginMethod.data
    })
})

module.exports = userRouter