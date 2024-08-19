var express = require("express");
var userRouter = express.Router();
var FeedbackController = require("./Controller");

userRouter.post("/feedback-create", async (req, res) => {
    try {
        var data = req.body;
        var feedbackCreate = await FeedbackController.feedbackCreate(data);
        
        res.status(200).send({
            status: feedbackCreate.status,
            message: feedbackCreate.message,
            data: feedbackCreate.data
        });
    } catch (error) {
        res.status(500).send({
            status: "500",
            message: "Internal Server Error",
            error: error.message
        });
    }
});

module.exports = userRouter;
