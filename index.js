var express = require('express');
var Constant = require('./commonfunction')
var app = express();
var cors = require('cors');
var dbconn = require("./database");
var UserLogin = require("./Login Function/Routes");
var RegisterUser = require("./Register Function/Routes")
var Data = require("./Ticket/Routes")
var FetchData = require("./FetchData/fetch")
app.use(cors({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type"
}))
app.use(express.json());
require('dotenv').config();
dbconn.databaseConn();

app.use("/api/v1/users", UserLogin);
app.use("/api/v1/users", RegisterUser);
app.use("/api/v1/users", Data);
app.use("/api/v1/users", FetchData);


app.listen(Constant.portNo, async (error, conn) => {
    if(error){
        console.log("error", error);
        throw error
    }
    console.log(`Server has been started on port no : ${Constant.portNo}`);
});