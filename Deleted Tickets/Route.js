var express = require("express");
var userRouter = express.Router();
var UserController = require("../Deleted Tickets/Controller");
var mongoose = require("mongoose");

userRouter.delete("/delete-ticket", async (req, res) => {
    var callDeleteTicket = await UserController.DeletedTickets(); // Swap the parameters
    res.send({
        status:  callDeleteTicket.status,
        message: callDeleteTicket.message,
        data: callDeleteTicket.data
        
    })
})

module.exports = userRouter;
