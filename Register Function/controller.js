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
            userStatus: data.userStatus,
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
            password: encryptPass,
            role: allParams.role,
            userStatus: allParams.userStatus
        }
    });

    if (checkUser) {
        return {
          status: 200,
          message: "User Updated Successfully",
        //   data: {checkUser}
        };
      }
} catch (error) {
    console.log(error);
    throw error
}
};

async function fetchUser(userEmail) {
  
    try {
        var fetch = await UserSchema.findOne({
            email: userEmail
        })
        if(fetch){
            return {
                status: 200,
                message: "User Fetched Successfully",
              };
        }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function deleteUser(userEmail) {
  
    try {
        var fetch = await UserSchema.findOneAndDelete({
            email: userEmail
        })
        if(fetch){
            return {
                status: 200,
                message: "User Deleted Successfully",
              };
        }
    } catch (error) {
        console.log(error);
        throw error
    }
}


async function fetchAllUser() {
  
    try {
        var fetchAll = await UserSchema.find()
        if(fetchAll){
            return {
                status: 200,
                message: "All User Fetched Successfully",
                data: {fetchAll}
              };
        }
    } catch (error) {
        console.log(error);
        throw error
    }
}
module.exports = { userRegister, UpdateUser, fetchUser, fetchAllUser, deleteUser }
