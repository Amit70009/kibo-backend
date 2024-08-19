var mongoUrl = process.env.MONGO_URL; // Paste cloud mongo url
// var mongoUrl = "mongodb+srv://amitvarshney30:Flash123@kibo-sandbox.t0rpqfm.mongodb.net/?retryWrites=true&w=majority&appName=kibo-sandbox"
var portNo = 7384;
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

async function encryptPassword(password){
    if(password){
        var encPas = bcrypt.hash(password, 10);
        return encPas;
    }
    else{
        return "";
    }
}

async function decryptPassword(reqPassword, userSavedPassword){
    if(reqPassword && userSavedPassword){
        var decPass = bcrypt.compare(reqPassword, userSavedPassword);
        return decPass
    }
    else{
        return "";
    }
}

function generateToken(payload){
    if(payload){
        var gTok = jwt.sign(payload, "weekendMern@123", {
            algorithm: "HS256",
            expiresIn: 3600
        })
        return gTok;
    }
    else{
        return "";
    }
}

module.exports = {
    mongoUrl,
    portNo, 
    encryptPassword, 
    decryptPassword, 
    generateToken
}