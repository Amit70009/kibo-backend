var express = require("express");
var userRouter = express.Router();
var UserController = require("./Controller");
var mongoose = require("mongoose");

userRouter.get("/search-ticket-by-id/:ticketID", async (req, res) => {
    const ticketID = req.params.ticketID
    var searchByID = await UserController.searchTicketbyID(ticketID);
    res.send({
        status: searchByID.status,
        message: searchByID.message,
        totalTicket: searchByID.ticket,
        data: searchByID.data
    })
})


module.exports = userRouter