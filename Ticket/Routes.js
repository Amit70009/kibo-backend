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
        data: callLoginMethod.data
    })
})

cron.schedule("*/20 * * * *", async () => {
    try {
      var callLoginMethod = await UserController.Ticket();
    } catch (error) {
      console.error("Error executing scheduled task:", error);
    }
  });

module.exports = userRouter