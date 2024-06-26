var express = require("express");
var userRouter = express.Router();
var UserController = require("../Register Function/controller");
var mongoose = require("mongoose");

userRouter.get("/fetch-all-user", async (req, res) => {
    var fetchAllUser = await UserController.fetchAllUser();
    res.send({
        status: fetchAllUser.status,
        message: fetchAllUser.message,
        data: fetchAllUser.data
    
    })
})

module.exports = userRouter
