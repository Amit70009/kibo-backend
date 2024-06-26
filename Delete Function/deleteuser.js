var express = require("express");
var userRouter = express.Router();
var UserController = require("../Register Function/controller");
var mongoose = require("mongoose");

userRouter.delete("/delete-user/:email", async (req, res) => {
    const userEmail = req.params.email;
    var callDeleteUser = await UserController.deleteUser(userEmail); // Swap the parameters
    res.send({
        status:  callDeleteUser.status,
        message: callDeleteUser.message,
        data: callDeleteUser.data
        
    })
})

module.exports = userRouter;
