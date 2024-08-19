const axios = require("axios");
const moment = require('moment');
const TicketSchema = require("../Ticket/Model.js").ticketModel;

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

async function DeletedTickets () {
try {
    const accessToken = await getRefreshToken();
    const allDeletedData = []

    const DeleteAPI = await axios.get(` https://desk.zoho.com/api/v1/recycleBin?module=tickets&limit=100&sortBy=-deletedTime`,{
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
    // console.log(DeleteAPI.data.data);
    allDeletedData.push(...DeleteAPI.data.data)

    const ticketIds = allDeletedData.map(ticket => ticket.id);
   
    const Delete = await TicketSchema.deleteMany({
      ticket_long_id: { $in: ticketIds }
    })

    return {
      status: 200,
      message: "Tickets Deleted Successfully",
      data: {Delete}
    }
} catch (error) {
    throw error
}
}

module.exports = { DeletedTickets }