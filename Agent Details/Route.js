var express = require("express");
var userRouter = express.Router();
var AgentController = require("./Controller");
var mongoose = require("mongoose");

userRouter.post("/agent-create", async (req, res) => {
    var agentData = await AgentController.CreateAgent();
    const createdAgents = Array.isArray(agentData.data.allData) ? agentData.data.allData.slice(0, 10) : [];
    res.send({
        status: agentData.status,
        message: agentData.message,
        data: createdAgents
    })
})

module.exports = userRouter