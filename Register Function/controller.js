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

async function UpdateUser(userEmail, allParams) {
    try {
      // Find the current user data
      const user = await UserSchema.findOne({ email: userEmail });
  
      if (!user) {
        return {
          status: 404,
          message: "User not found",
        };
      }
  
      // Prepare the fields to update
      let updates = {};
  
      if (allParams.password) {
        const encryptPass = await CommonFunc.encryptPassword(allParams.password);
        updates.password = encryptPass;
      }
      if (allParams.role) {
        updates.role = allParams.role;
      }
      if (allParams.userStatus) {
        updates.userStatus = allParams.userStatus;
      }
  
      // Update the user document with the new values
      const updatedUser = await UserSchema.findOneAndUpdate(
        { email: userEmail },
        { $set: updates },
        { new: true } // return the updated document
      );
  
      if (updatedUser) {
        return {
          status: 200,
          message: "User Updated Successfully",
          data: updatedUser,
        };
      } else {
        return {
          status: 500,
          message: "Failed to update user",
        };
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  

async function fetchUser(userEmail) {
  
    try {
        var fetch = await UserSchema.findOne({
            email: userEmail
        })
        if(fetch){
            return {
                status: 200,
                message: "User Fetched Successfully",
                data: fetch
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
        if(fetchAllUser){
            return {
                status: 200,
                message: "All User Fetched Successfully",
                data: {fetchAllUser}
              };
        }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function fetchAllClient() {
  
  try {
      var fetchAllClient = await UserSchema.find()
      if(fetchAllClient){
          return {
              status: 200,
              message: "All Client Fetched Successfully",
              data: {fetchAllClient}
            };
      }
  } catch (error) {
      console.log(error);
      throw error
  }
}
module.exports = { userRegister, UpdateUser, fetchUser, fetchAllUser, deleteUser, fetchAllClient }
