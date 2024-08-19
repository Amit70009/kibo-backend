var express = require("express");
var userRouter = express.Router();
var FeedbackController = require("./Controller");

userRouter.get("/fetch-feedback", async (req, res) => {
    try {
       
        var feedbackCreate = await FeedbackController.FetchAllFeedback();
        
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
