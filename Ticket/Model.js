const { MaxKey } = require("mongodb");
var mongoose = require("mongoose");

var ticketSchema = new mongoose.Schema({
ticket_id: {type: String},
ticket_long_id: {type: String},
ticket_url: {type: String},
ticket_subject: {type: String},
is_ticket_archieved: {type: Boolean},
last_touched: {type: String},
customer_last_response_time: {type: String},
is_trashed: {type: Boolean},
department: {type: String},
email: {type: String},
ticket_owner: {type: String},
ticket_owner_email: {type: String},
account_name: {type: String},
created_at: {type: Date},
last_modified: {type: Date},
status: {type: String},
status_type: {type: String},
resolution: {type: String},
severity: {type: String},
last_update: {type: Date},
resolved_at: {type: Date},
first_response_time: {type: String},
first_response_time_status: {type: String},
ticket_age: {type: String},
age_bucket: {type: String},
department_transfer_time: {type: String},
last_department_ticket_age: {type: String},
last_department_age_bucket: {type: String},
custom_data: {
    classification: { type: String },
    request_escalation: { type: Boolean },
    escalation_reason: {type: String},
    is_sev1: {type: Boolean},
    resolution_type: {type: String},
    issue_type: {type: String},
    issue_sub_type: {type: String},
    jira_id: {type: String},
    resolution_owner: {type: String},
},
department_history: [
    {
      department: String,
      start_time: String,
      end_time: String,
      total_time: Object // Time in minutes
    },
    { _id: false },
    {__v: false}
  ],
});
var ticketModel = mongoose.model("ticket", ticketSchema);

module.exports = {
    ticketModel
}
