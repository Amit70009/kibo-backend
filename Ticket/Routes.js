var express = require("express");
var userRouter = express.Router();
var UserController = require("../Ticket/Controller");
var mongoose = require("mongoose");
var cron = require("node-cron");

userRouter.post("/ticket-create", async (req, res) => {
    var callLoginMethod = await UserController.Ticket();
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: "done"
    })
})


module.exports = userRouter