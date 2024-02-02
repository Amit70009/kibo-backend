var express = require("express");
var userRouter = express.Router();
var fetchData = require("../Ticket/Controller");
var mongoose = require("mongoose");

userRouter.get("/fetch-all-data", async (req, res) => {
    const queryParams = req.query
    var FetchOrders = await fetchData.GetAllData(queryParams);
    res.send({
        status: FetchOrders.status,
        message: FetchOrders.message,
        data: FetchOrders.data
    })
})

module.exports = userRouter
