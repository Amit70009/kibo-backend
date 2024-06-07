const { ObjectID, UUID } = require("bson");
const express = require("express")
var UserSchema = require("../Login Function/Model").usermodel;
var CommonFunc = require("../commonfunction");

/* For Register */
async function userRegister(data){
    try {
        var checkUserData = await UserSchema.find({
        email: data.email
        });
        if(checkUserData.length){
            return {
                status: 201,
                message: "User already registered with this email",
                data: {}
            }
        }
        let encryptPass = await CommonFunc.encryptPassword(data.password);
        var regObj = {
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            gender: data.gender,
            password: encryptPass,
            createdOn: new Date(),
        }

        await UserSchema.create(regObj);

        // Send email to that user email :

        return {
            status: 200,
            message: "Registration successfully",
            data: {}
        }
    } catch (error) {
        console.log(error);
        throw error
    }
};

async function UpdateUser (userEmail, allParams, data) {
    let encryptPass = await CommonFunc.encryptPassword(allParams.password);
try {
    var checkUser = await UserSchema.findOneAndUpdate({
        email: userEmail
        },
    {
        $set:{
            password: encryptPass
        }
    });

    if (checkUser) {
        return {
          status: 200,
          message: "Password Updated Successfully",
        };
      }
} catch (error) {
    console.log(error);
    throw error
}
};

module.exports = { userRegister, UpdateUser }
