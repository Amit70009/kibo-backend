const { ObjectID } = require("bson");
var UserSchema = require("../Login Function/Model").usermodel;
var CommonFunc = require("../commonfunction.js");

async function userLogin(data){
    try {
        var matchUser = await UserSchema.findOne({
           email: data.email,
        },{createdOn: 0, __v: 0})
        if(matchUser){
        if(matchUser.userStatus == "Active"){
        let decryptPass = await CommonFunc.decryptPassword(data.password, matchUser.password);
        if(decryptPass == false){
            return {
                status: 202,
                message: "Password is Incorrect, or unmatched",
                data: {}
            }
        }

        let genToken = CommonFunc.generateToken({id: matchUser._id});
        await UserSchema.updateOne({_id: matchUser._id}, {
            $set: {
                acc_token: genToken
            }
        });

        return {
            status: 200,
            message: "Login successfully",
            data: {
                userId: matchUser._id,
                full_name: matchUser.full_name,
                email: matchUser.email,
                role: matchUser.role,
                acc_token: genToken,
                userStatus: matchUser.userStatus
            }
        }
        }
        else if(matchUser.userStatus != "Active"){
            return {
                status: 401,
                message: "Your account request is not approved yet. Please reach out to Admin ",
            }
        }
    }
    
    return {
        status: 404,
        message: "User not found, Either Email or password is incorrect",
        data: {matchUser}
    }
} catch (error) {
    console.log(error);
    throw error
}
}

async function fetchProfile(data){
try {
    var matchUser = await UserSchema.findOne({
    email: data });
    if(matchUser){
        return{
            status: 200,
            message: "fetch Successfully",
            data: {matchUser}
        }
    }
} catch (error) {
    console.log(error);
}
}

async function fetchAllProfile(data){
    try {
        var matchUser = await UserSchema.find();
        if(matchUser){
            return{
                status: 200,
                message: "All Profile fetched Successfully",
                data: {matchUser}
            }
        }
    } catch (error) {
        console.log(error);
    }
    }

async function UpdateProfile(userID, data){
    try {
        var updateFields = {
            full_name: data.full_name,
            gender: data.gender,
            billing_address: data.billing_address,
            shipping_address: data.shipping_address,
            password: data.password,
            role: data.role,
            mobile: data.mobile,
            isUserActive: data.isUserActive,
        };

        var UpdateProf = await UserSchema.findOneAndUpdate(
            { email: userID },
            { $set: updateFields },
            { new: true }
        );
        if(UpdateProf){
            return{
                status: 200,
                message: "User Updated successfully",
                data: { UpdateProf }
            }
        }
    } catch (error) {
        console.log(error);
        return {
            status: 500, 
            message: "Internal Server Error"
        };
    }

}

async function UpdateProfilePic(userID, data, allParams){
    try {
        
        const filename = allParams;

        var UpdateProf = await UserSchema.findOneAndUpdate(
            { email: userID },
            { $set: {profileImage: filename} },
            { new: true }
        );
        if(UpdateProf){
            return{
                status: 200,
                message: "User Profile Updated successfully",
                data: { UpdateProf }
            }
        }
    } catch (error) {
        console.log(error);
        return {
            status: 500, 
            message: "Internal Server Error"
        };
    }

}
module.exports = { userLogin, fetchProfile, UpdateProfile, fetchAllProfile, UpdateProfilePic }
