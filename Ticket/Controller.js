const axios = require("axios");
const moment = require('moment');
const TicketSchema = require("../Ticket/Model.js").ticketModel;

let refreshTokenData = null;

async function getRefreshToken() {
  try {
    // If refresh token data is not available or it's been more than 20 minutes since the last request
    if (!refreshTokenData || moment().diff(refreshTokenData.timestamp, 'minutes') > 20) {
      const response = await axios.post(
        `https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token&client_id=${process.env.CLIENTID}&client_secret=${process.env.CLIENTSECRET}&refresh_token=${process.env.TOKEN}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
        }
      );
      refreshTokenData = {
        access_token: response.data.access_token,
        timestamp: moment(), // Update the timestamp
      };
    }
    return refreshTokenData.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

async function Ticket(dataFromExternalSource) {
  try {
    const apiCallTime = new Date();
   
    const accessToken = await getRefreshToken();
    const externalData = await axios.get(
      `https://desk.zoho.com/api/v1/tickets?limit=100&sortBy=-modifiedTime`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const agentsResponse = await axios.get(
      "https://desk.zoho.com/api/v1/agents?limit=200",
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const agentsMap = {};
    agentsResponse.data.data.forEach((agent) => {
      agentsMap[agent.id] = {
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.emailId
      };
    });

    const ticketDataPromises = externalData.data.data.map(async (ticket) => {
      const existingTicket = await TicketSchema.findOne({
        ticket_id: ticket.ticketNumber,
      });

      // console.log(existingTicket.ticket_id);

      const specificData = await axios.get(
        `https://desk.zoho.com/api/v1/tickets/${ticket.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // const ticketMetrics = await axios.get(
      //   `https://desk.zoho.com/api/v1/tickets/832118000033612001/metrics`,
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       accept: "application/json",
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //   }
      // )
      
      // console.log(ticketMetrics.data);

      let accountData;

      if(specificData.data.departmentId) {
        departmentId = await axios.get(`https://desk.zoho.com/api/v1/departments/${specificData.data.departmentId}`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } 

      if (specificData.data.accountId) {
      accountData = await axios.get(
        `https://desk.zoho.com/api/v1/accounts/${specificData.data.accountId}`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } else {
     
      accountData = { data: { accountName: null } }; // Mock account data
    }

    const createDate = ticket.createdTime
    

    const dateString1 = specificData.data.closedTime ? specificData.data.closedTime.split('T')[0] : apiCallTime.toISOString().split('T')[0];
const dateString2 = ticket.createdTime.split('T')[0];


    const date1 = new Date(dateString1);
    const date2 = new Date(dateString2);

    const difference = ((date1 - date2)/(1000 * 3600 * 24))+1;

    
    let age_bucket;

    // Categorize ticket age into different ranges
    if (difference >= 1 && difference < 3) {
      age_bucket = "1-3 days";
    } else if(difference >=4 && difference < 10) {
      age_bucket = "4-10 days"
    } else if(difference >=11 && difference < 30) {
      age_bucket = "11-30 days"
  } else if(difference >=31 && difference < 60) {
    age_bucket = "31-60 days"
} else if(difference >= 61 && difference < 90) {
  age_bucket = "61-90 days"
  } else if (difference >= 91) {
    age_bucket = "More than 90 days"
  }

      if (!existingTicket) {
        // Extracting account_name information
        const accountId = ticket.assigneeId;
        const agentInfo = agentsMap[accountId];
        // console.log("Data", agentInfo);
        const ticket_owner = agentInfo
          ? `${agentInfo.firstName} ${agentInfo.lastName}`
          : "Unassigned";
        const ticket_owner_email = agentInfo ? `${agentInfo.email}` : "null";

        return TicketSchema.create({
          ticket_id: ticket.ticketNumber,
          ticket_url: ticket.webUrl,
          ticket_subject: ticket.subject,
          department: departmentId.data.name,
          email: ticket.email,
          ticket_owner,
          ticket_owner_email,
          account_name: accountData.data.accountName,
          status: ticket.status,
          created_at: ticket.createdTime,
          resolution: specificData.data.resolution,
          last_modified: specificData.data.modifiedTime,
          severity: specificData.data.customFields["Severity"],
          last_update: apiCallTime,
          resolved_at: specificData.data.closedTime || null,
          ticket_age: difference,
          age_bucket: age_bucket,
        });
      } else {     
        const accountId = ticket.assigneeId;
        const agentInfo = agentsMap[accountId];
        // console.log("Data", agentInfo);
        const ticket_owner = agentInfo
          ? `${agentInfo.firstName} ${agentInfo.lastName}`
          : "Unassigned";
        const ticket_owner_email = agentInfo ? `${agentInfo.email}` : "null";

        existingTicket.last_update = apiCallTime;
        existingTicket.resolved_at = specificData.data.closedTime || null;
        existingTicket.ticket_owner = ticket_owner;
        existingTicket.department = departmentId.data.name;
        existingTicket.ticket_owner_email = ticket_owner_email;
        existingTicket.status = ticket.status;
        existingTicket.ticket_subject = ticket.subject;
        existingTicket.resolution = specificData.data.resolution;
        existingTicket.last_modified = specificData.data.modifiedTime;
        existingTicket.severity = specificData.data.customFields["Severity"];
        existingTicket.account_name = accountData.data.accountName;
        existingTicket.age_bucket = age_bucket;
        existingTicket.ticket_age = difference;
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

async function GetAllData(data){
  try {
    const { start_date, end_date, ticket_owner_email, account_name, status, severity, created_start_date, created_end_date, department, ...otherParams } = data;
    const startDate = start_date ? moment(start_date).toDate() : new Date("2024-01-01T00:00:00.000Z");
    const endDate = end_date ? moment(end_date).toDate() : new Date();
    const createdStartDate = created_start_date ? moment(created_start_date).toDate() : new Date("2024-01-01T00:00:00.000Z");
    const createdEndDate = created_end_date ? moment(created_end_date).toDate() : new Date();

    const query = {
      ...otherParams, // Include other query parameters
      last_modified: { $gte: startDate, $lte: endDate },
      created_at: { $gte: createdStartDate, $lte: createdEndDate }
    };

    if (ticket_owner_email) {
      const ticketOwners = ticket_owner_email.split(',').map(owner => owner.trim());
      query.ticket_owner_email = { $in: ticketOwners }; 
    }

    if (department) {
      const departments = department.split(',').map(dep => dep.trim());
      query.department = { $in: department }; 
    }

    if (account_name) {
      const accountOwners = account_name.split(',').map(accountowner => accountowner.trim());
      query.account_name = { $in: accountOwners }; 
    }

    if (status) {
      const ticketStatus = status.split(',').map(stat => stat.trim());
      query.status = { $in: ticketStatus }; 
    }

    if (severity) {
      const ticketSeverity = severity.split(',').map(sev => sev.trim());
      query.severity = { $in: ticketSeverity }; 
    }

        const ticketData = await TicketSchema.find(query);
      // var ticketData = await TicketSchema.find(data)
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

async function AgentName() {
try {
  const accessToken = await getRefreshToken(); // Get access token
  const agentsResponse = await axios.get(
    "https://desk.zoho.com/api/v1/agents?limit=200",
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = agentsResponse.data

  if(agentsResponse){
    return{
        status: 200,
        message: "All agent Fetched Successfully",
        data: {data}
    }
}

} catch (error) {
  throw error
}
}

async function AccountName(accessToken) {
  try {
    const accessToken = await getRefreshToken(); // Get access token
    const accountData = await axios.get(
      `https://desk.zoho.com/api/v1/accounts?limit=100`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`, // Use access token in the request header
        },
      }
    );

    return {
      status: 200,
      message: "All Account Fetched Successfully",
      data: accountData.data,
    };
  } catch (error) {
    console.error("Error fetching account data:", error);
    throw error;
  }
}

module.exports = { Ticket, GetAllData, AccountName, AgentName};
