var express = require("express");
var userRouter = express.Router();
var FeedbackController = require("./Controller");

// Define the route to fetch feedback by feedbackid
userRouter.delete("/delete-feedback/:feedbackID", async (req, res) => {
    try {
        const feedbackId = req.params.feedbackID;
        var feedbackFetch = await FeedbackController.DeleteFeedback(feedbackId);

        res.status(200).send({
            status: feedbackFetch.status,
            message: feedbackFetch.message,
            data: feedbackFetch.data
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
