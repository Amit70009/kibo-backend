const { MaxKey } = require("mongodb");
var mongoose = require("mongoose");

var accountSchema = new mongoose.Schema({
accountId: {type: String},
accountName: {type: String},
});
var accountModel = mongoose.model("Account", accountSchema);

module.exports = {
    accountModel
}
