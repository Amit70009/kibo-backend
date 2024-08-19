var mongoose = require("mongoose");

var feedbackSchema = new mongoose.Schema({
    feedback_id: { type: String, default: () => new mongoose.Types.ObjectId() },
    feedback_subject: { type: String, required: true },
    feedback_submitted_by: { type: String, required: true },
    feedback_message: { type: String, required: true },
    feedback_status: { type: String, required: true },
    createdOn: { type: Date, default: Date.now }
});

var feedbackModel = mongoose.model("feedback", feedbackSchema);

module.exports = {
    feedbackModel
};
