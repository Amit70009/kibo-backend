var express = require("express");
var userRouter = express.Router();
var FeedbackController = require("./Controller");

// Define the route to fetch feedback by feedbackid
userRouter.put("/update-feedback/:feedbackID", async (req, res) => {
    try {
        const feedbackId = req.params.feedbackID;
        const data = req.body
        var feedbackFetch = await FeedbackController.UpdateFeedback(feedbackId, data);

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
