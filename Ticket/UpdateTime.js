var express = require("express");
var userRouter = express.Router();
var UserController = require("./Controller");
var mongoose = require("mongoose");
var cron = require("node-cron");

userRouter.put("/update-ticket-timer", async (req, res) => {
    var updateMethod = await UserController.UpdateTicketTime();
    res.send({
        status: "Done",
        // message: callLoginMethod.message,
        
    })
})


module.exports = userRouter