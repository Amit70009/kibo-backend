var express = require("express");
var userRouter = express.Router();
var UserController = require("./Controller");
var mongoose = require("mongoose");

userRouter.get("/search-ticket-by-number/:ticketNumber", async (req, res) => {
    const ticketNumber = req.params.ticketNumber
    var searchByNumber = await UserController.searchTicketbynumber(ticketNumber);
    res.send({
        status: searchByNumber.status,
        message: searchByNumber.message,
        totalTicket: searchByNumber.ticket,
        data: searchByNumber.data
    })
})


module.exports = userRouter