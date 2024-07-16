var express = require("express");
var userRouter = express.Router();
var UserController = require("../Ticket/Controller");
var mongoose = require("mongoose");
var cron = require("node-cron");

userRouter.post("/ticket-create", async (req, res) => {
    var callLoginMethod = await UserController.Ticket();
    const createdTickets = Array.isArray(callLoginMethod.data.createdTickets) ? callLoginMethod.data.createdTickets.slice(0, 10) : [];
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: {
            createdTickets: createdTickets
        }
    })
})


module.exports = userRouter