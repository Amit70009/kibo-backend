const { MaxKey } = require("mongodb");
var mongoose = require("mongoose");

var agentSchema = new mongoose.Schema({
agentId: {type: String},
agentName: {type: String},
agentEmail: {type: String},
agentStatus: {type: String},
isConfirmed: {type: Boolean},
agentRoleId:{type: String},
departmentId: [{type: String}]
});
var agentModel = mongoose.model("Agent", agentSchema);

module.exports = {
    agentModel
}
