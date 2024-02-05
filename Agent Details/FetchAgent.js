var express = require("express");
var userRouter = express.Router();
var fetchAgent = require("../Agent Details/Controller");
var mongoose = require("mongoose");

userRouter.get("/fetch-all-agent", async (req, res) => {
   
    var FetchAgent = await fetchAgent.GetAllAgent();
    res.send({
        status: FetchAgent.status,
        message: FetchAgent.message,
        data: FetchAgent.data
    })
})

module.exports = userRouter
