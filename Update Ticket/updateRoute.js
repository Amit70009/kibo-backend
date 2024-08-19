var express = require("express");
var userRouter = express.Router();
var UserController = require("../Search Ticket/Controller");
var mongoose = require("mongoose");

userRouter.put("/update-ticket", async (req, res) => {
    const data = req.body
    var updateTicket = await UserController.updateTicket(data);
    res.send({
       message: "done"
        // status: updateTicket.status,
        // message: updateTicket.message,
        // totalTicket: searchByNumber.ticket,
        // data: updateTicket.data
    })
})


module.exports = userRouter