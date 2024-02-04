const { MaxKey } = require("mongodb");
var mongoose = require("mongoose");

var ticketSchema = new mongoose.Schema({
ticket_id: {type: String},
ticket_url: {type: String},
email: {type: String},
ticket_owner: {type: String},
ticket_owner_email: {type: String},
account_name: {type: String},
created_at: {type: Date},
last_modified: {type: Date},
status: {type: String},
resolution: {type: String},
severity: {type: String},
last_update: {type: Date},
resolved_at: {type: Date},
ticket_age: {type: String}
});
var ticketModel = mongoose.model("ticket", ticketSchema);

module.exports = {
    ticketModel
}
