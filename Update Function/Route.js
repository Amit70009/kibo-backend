var express = require("express");
var userRouter = express.Router();
var UserController = require("../Register Function/controller");
var mongoose = require("mongoose");

userRouter.put("/update-user/:email", async (req, res) => {
    const userEmail = req.params.email;
    const allParams = req.body;
    var callUpdateUser = await UserController.UpdateUser(userEmail, allParams); // Swap the parameters
    res.send({
        status:  callUpdateUser.status,
        message: callUpdateUser.message,
        data: callUpdateUser.data
        
    })
})

module.exports = userRouter;
