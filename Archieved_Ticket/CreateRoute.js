var express = require("express");
var userRouter = express.Router();
var UserController = require("./Controller");
var mongoose = require("mongoose");
var cron = require("node-cron");

userRouter.post("/create-archieved-tickets", async (req, res) => {
    var callLoginMethod = await UserController.createArchTicket();
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        // data: callLoginMethod.data
    })
})

cron.schedule("*/30 * * * *", async () => {
    try {
      var callLoginMethod = await UserController.archivedTickets();
    } catch (error) {
      console.error("Error executing scheduled task:", error);
    }
  });

module.exports = userRouter