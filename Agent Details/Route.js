var express = require("express");
var userRouter = express.Router();
var AgentController = require("./Controller");
var mongoose = require("mongoose");

userRouter.post("/agent-create", async (req, res) => {
    var agentData = await AgentController.CreateAgent();
    res.send({
        status: agentData.status,
        message: agentData.message,
        data: agentData.data
    })
})

module.exports = userRouter