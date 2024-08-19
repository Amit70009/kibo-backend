const { v4: uuidv4 } = require("uuid");
var FeedbackSchema = require("./Model").feedbackModel;

async function feedbackCreate(data) {
    try {
        const feedback = await FeedbackSchema.create({
            feedback_id: data.feedback_id ? data.feedback_id : uuidv4(),
            feedback_message: data.feedback_message,
            feedback_subject: data.feedback_subject,
            feedback_status: data.feedback_status,
            feedback_submitted_by: data.feedback_submitted_by
        });

        return {
            status: "200",
            message: "Feedback Submitted Successfully",
            data: feedback
        };
    } catch (error) {
        return {
            status: "500",
            message: "Failed to Submit Feedback",
            error: error.message
        };
    }
}

async function FetchAllFeedback(){
try {
    const FetchData = await FeedbackSchema.find()
    if(!FetchData){
        return {
            status: "200",
            message: "No Feedback Found",
            data: {}
        }
    }
    else {
        return {
            status: "200",
            message: "All Feedback Fetched Successfully",
            data: FetchData
        }
    }
} catch (error) {
    throw error
}
}

async function FetchFeedback(feedbackId){
    try {
        const FetchData = await FeedbackSchema.findOne({
            feedback_id: feedbackId
        })
        if(!FetchData){
            return {
                status: "200",
                message: "No Feedback Found",
                data: {}
            }
        }
        else {
            return {
                status: "200",
                message: "Feedback Fetched Successfully",
                data: FetchData
            }
        }
    } catch (error) {
        throw error
    }
    }

    async function DeleteFeedback(feedbackId){
        try {
            const FetchData = await FeedbackSchema.findOneAndDelete({
                feedback_id: feedbackId
            })
            if(!FetchData){
                return {
                    status: "200",
                    message: "No Feedback Found",
                    data: {}
                }
            }
            else {
                return {
                    status: "200",
                    message: "Feedback Deleted Successfully",
                    data: FetchData
                }
            }
        } catch (error) {
            throw error
        }
        }

        async function UpdateFeedback(feedbackId, data) {
try {
    const FetchData = await FeedbackSchema.findOneAndUpdate(
        {feedback_id: feedbackId},
    {
        $set:{
            feedback_status: data.feedbackStatus,
            feedback_message: data.feedbackMessage,
            feedback_subject: data.feedbackSubject
        }
    }, {
        new: true
    })
    if(!FetchData){
        return {
            status: "200",
            message: "No Feedback Found",
            data: {}
        }
    } else {
        return {
            status: "200",
            message: "Feedback Updated Successfully",
            data: FetchData
        }
    }
} catch (error) {
    throw error
}
        }

module.exports = { feedbackCreate, FetchAllFeedback, FetchFeedback, DeleteFeedback, UpdateFeedback };
