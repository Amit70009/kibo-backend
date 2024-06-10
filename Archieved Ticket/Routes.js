var express = require("express");
var userRouter = express.Router();
var UserController = require("../Archieved Ticket/Controller");
var mongoose = require("mongoose");
var cron = require("node-cron");

userRouter.post("/archieved-ticket", async (req, res) => {
    var callLoginMethod = await UserController.archivedTickets();
    res.send({
      status: "Done"
        // status: callLoginMethod.status,
        // message: callLoginMethod.message,
        // data: callLoginMethod.data
    })
})

module.exports = userRouter