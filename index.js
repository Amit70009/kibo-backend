var express = require('express');
var Constant = require('./commonfunction');
var app = express();
var cors = require('cors');
var dbconn = require("./database");
var UserLogin = require("./Login Function/Routes");
var RegisterUser = require("./Register Function/Routes");
var Data = require("./Ticket/Routes");
var AccountName = require("./AccoutName/accountName");
var AgentName = require("./AgentName/agentName");
var AgentData = require("./Agent Details/Route");
var AccountData = require("./AccountDetails/Route");
var FetchAgent = require('./Agent Details/FetchAgent');
var FetchAccount = require('./AccountDetails/FetchAccount');
var ArchievedTicket = require('./Archieved Ticket/Routes');
var FetchData = require("./FetchData/fetch");
var Token = require("./Login Function/tokengenerate");
var createArchTicket = require("./Archieved Ticket/CreateRoute");
var serverless = require("serverless-http")

app.use(cors({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type"
}));
app.use(express.json());
require('dotenv').config();
dbconn.databaseConn();

const validApiKeys = [process.env.API_KEY];

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['api-key'];

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: "You are not authorized to perform this action. Please check with your admin"
    });
  }

  next(); // Continue to the next middleware or route
};

app.use(authenticateApiKey);
app.use("/api/v1/users", UserLogin);
app.use("/api/v1/users", RegisterUser);
app.use("/api/v1/users", Data);
app.use("/api/v1/users", FetchData);
app.use("/api/v1/users", AccountName);
app.use("/api/v1/users", AgentName);
app.use("/api/v1/users", AgentData);
app.use("/api/v1/users", AccountData);
app.use("/api/v1/users", FetchAgent);
app.use("/api/v1/users", FetchAccount);
app.use("/api/v1/users", ArchievedTicket);
app.use("/api/v1/users", createArchTicket);


app.listen(Constant.portNo, async (error, conn) => {
  if(error){
      console.log("error", error);
      throw error
  }
  console.log(`Server has been started on port no : ${Constant.portNo}`);
});

module.exports = app;
