const { default: axios } = require("axios")
const moment = require('moment');

let refreshTokenData = null;

async function getRefreshToken() {
  try {
    if (!refreshTokenData || moment().diff(refreshTokenData.timestamp, 'minutes') > 20) {
      const response = await axios.post(
        `https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token&client_id=${process.env.CLIENTID}&client_secret=${process.env.CLIENTSECRET}&refresh_token=${process.env.TOKEN}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json"
          },
        }
      );
      refreshTokenData = {
        access_token: response.data.access_token,
        timestamp: moment(),
      };
    }
    return refreshTokenData.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

async function searchTicketbynumber(ticketNumber) {
    try {
      const accessToken = await getRefreshToken();
      const response = await axios.get(`https://desk.zoho.com/api/v1/tickets/search?ticketNumber=${ticketNumber}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`, // Use access token in the request header
        },
      });
  
      return {
        status: 200,
        message: "Tickets Search Successfully",
        ticket: response.data.count,
        data: response.data.data, // Return the data from the response
      };
    } catch (error) {
      return {
        status: error.response ? error.response.status : 500,
        message: error.response ? error.response.data.message : "Internal Server Error",
        error: error.response ? error.response.data : error.message,
      };
    }
  }

  async function searchTicketbyID(ticketID) {
    try {
      const accessToken = await getRefreshToken();
      const response = await axios.get(`https://desk.zoho.com/api/v1/tickets/search?id=${ticketID}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`, // Use access token in the request header
        },
      });
  
      return {
        status: 200,
        message: "Tickets Search Successfully",
        ticket: response.data.count,
        data: response.data.data, // Return the data from the response
      };
    } catch (error) {
      return {
        status: error.response ? error.response.status : 500,
        message: error.response ? error.response.data.message : "Internal Server Error",
        error: error.response ? error.response.data : error.message,
      };
    }
  }

  async function updateTicket(data){
try {
    const accessToken = "1000.65034f5162704c3bfdecf0461b4be6c5.74f12bb9d71016e4306a2ceb03aece16"
    const response = await axios.post(`https://desk.zoho.com/api/v1/tickets/updateMany`, {
        fieldName: data.fieldName,
        ids: data.ids,
        isCustomField: data.isCustomField,
        fieldValue: data.fieldValue
    }, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`, // Use access token in the request header
          },
    })
    return {
        status: 200,
        message: "Tickets Updated Successfully",
    }
} catch (error) {
    console.log(error);
}
  }
    
module.exports = {searchTicketbynumber, searchTicketbyID, updateTicket}