var express = require("express");
var userRouter = express.Router();
var UserController = require("../Register Function/controller");
var mongoose = require("mongoose");

userRouter.get("/fetch-user/:email", async (req, res) => {
    const userEmail = req.params.email;
    var fetchUser = await UserController.fetchUser(userEmail);
    res.send({
        status: fetchUser.status,
        message: fetchUser.message,
        data: fetchUser.data
    
    })
})

module.exports = userRouter
