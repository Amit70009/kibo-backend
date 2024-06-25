const { MaxKey } = require("mongodb");
var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, require: true },
    password: { type: String },
    role: {type: String, default:"User"},
    acc_token: {type: String},
    isUserActive: { type: Boolean },
    userStatus: {type: String},
    otp: {type: String},
    otpCreatedAt: {type: Date, default: new Date()},
    profileImage: {data: Buffer, contentType: String,},
    gender: {type: String},
    createdOn: {type: Date, default: new Date()},
    
});
var usermodel = mongoose.model("users", userSchema);

module.exports = {
    usermodel
}
