const axios = require("axios");
const TicketSchema = require("../Ticket/Model.js").ticketModel;

async function Ticket(dataFromExternalSource) {
  try {
    const apiCallTime = new Date();
    const refreshToken = await axios.post(
      `https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token&client_id=${process.env.CLIENTID}&client_secret=${process.env.CLIENTSECRET}&refresh_token=${process.env.TOKEN}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    const externalData = await axios.get(
      "https://desk.zoho.com/api/v1/tickets?limit=5&sortBy=-modifiedTime",
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${refreshToken.data.access_token}`,
        },
      }
    );

    const agentsResponse = await axios.get(
      "https://desk.zoho.com/api/v1/agents?limit=200",
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${refreshToken.data.access_token}`,
        },
      }
    );

    const agentsMap = {};
    agentsResponse.data.data.forEach((agent) => {
      agentsMap[agent.id] = {
        firstName: agent.firstName,
        lastName: agent.lastName,
      };
    });

    const ticketDataPromises = externalData.data.data.map(async (ticket) => {
      const existingTicket = await TicketSchema.findOne({
        ticket_id: ticket.id,
      });

      const specificData = await axios.get(
        `https://desk.zoho.com/api/v1/tickets/${ticket.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${refreshToken.data.access_token}`,
          },
        }
      );

      let accountData;
      if (specificData.data.accountId) {
      accountData = await axios.get(
        `https://desk.zoho.com/api/v1/accounts/${specificData.data.accountId}`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${refreshToken.data.access_token}`,
          },
        }
      );
    } else {
      console.log("specificData.data.accountId is null");
      accountData = { data: { accountName: null } }; // Mock account data
    }

    const createDate = ticket.createdTime
    

    const dateString1 = specificData.data.closedTime ? specificData.data.closedTime.split('T')[0] : apiCallTime.toISOString().split('T')[0];
const dateString2 = ticket.createdTime.split('T')[0];


    const date1 = new Date(dateString1);
    const date2 = new Date(dateString2);

    const difference = (date1 - date2)/(1000 * 3600 * 24);

    
    let ticket_age;

    // Categorize ticket age into different ranges
    if (difference >= 1 && difference < 3) {
        ticket_age = "1-3 days";
    } else if(difference >=4 && difference < 10) {
        ticket_age = "4-10 days"
    } else if(difference >=11 && difference < 30) {
      ticket_age = "11-30 days"
  } else if(difference >=31 && difference < 60) {
    ticket_age = "30-60 days"
} else {
    ticket_age = "More than 60 days"
  }

      if (!existingTicket) {
        // Extracting account_name information
        const accountId = ticket.assigneeId;
        const agentInfo = agentsMap[accountId];
        const ticket_owner = agentInfo
          ? `${agentInfo.firstName} ${agentInfo.lastName}`
          : "Unassigned";

         
            
        // Creating the new ticket
        return TicketSchema.create({
          ticket_id: ticket.id,
          ticket_url: ticket.webUrl,
          email: ticket.email,
          ticket_owner,
          account_name: accountData.data.accountName,
          status: ticket.status,
          created_at: ticket.createdTime,
          last_modified: specificData.data.modifiedTime,
          severity: specificData.data.customFields["Severity"],
          last_update: apiCallTime,
          resolved_at: specificData.data.closedTime || null,
          ticket_age,
        });
      } else {
        existingTicket.last_update = apiCallTime;
        existingTicket.resolved_at = specificData.data.closedTime || null;
        existingTicket.ticket_owner;
        existingTicket.status = ticket.status;
        existingTicket.last_modified = specificData.data.modifiedTime;
        existingTicket.severity = specificData.data.customFields["Severity"];
        existingTicket.account_name = accountData.data.accountName;
        existingTicket.ticket_age = ticket_age;
        await existingTicket.save(); // Save the updated ticket
        return existingTicket;
      }
    });

    // Wait for all promises to resolve
    const insertedTickets = await Promise.all(ticketDataPromises);

    // Filter out null values (skipped tickets)
    const createdTickets = insertedTickets.filter((ticket) => ticket !== null);

    return {
      status: 200,
      message: "Orders Created Successfully",
      data: { createdTickets },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function GetAllData(data, queryParams){
  try {
      const filter = { ...queryParams };
      var ticketData = await TicketSchema.find(filter)
      if(ticketData){
          return{
              status: 200,
              message: "All data Fetched Successfully",
              data: {ticketData}
          }
      }
  } catch (error) {
      console.log(error);
      throw error
  }
}

module.exports = { Ticket, GetAllData };
