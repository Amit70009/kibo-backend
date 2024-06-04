const axios = require("axios");
const moment = require('moment');
const TicketSchema = require("../Ticket/Model").ticketModel;

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
            accept: "application/json",
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

async function archivedTickets(dataFromExternalSource) {
  try {
    const apiCallTime = new Date();
    const departmentIds = [
        "832118000000006907",
        "832118000016851245",
        "832118000022988053",
        "832118000025206039",
        "832118000027338037",
        "832118000034713312",
      ];
    const accessToken = await getRefreshToken();
    const batchSize = 100
    const allData = [];

    for (const departmentId of departmentIds) {
     
      let hasMoreData = true;
      range = 1;
      while(hasMoreData) {
        const archTicketResponse = await axios.get(
          `https://desk.zoho.com/api/v1/tickets/archivedTickets?from=${range}&limit=${batchSize}&departmentId=${departmentId}&viewType=1`,
          {
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (archTicketResponse && archTicketResponse.data && archTicketResponse.data.data && archTicketResponse.data.data.length > 0) {
            allData.push(...archTicketResponse.data.data);
            range += batchSize; 
        }
        else{
          hasMoreData = false;
        }
      }
      }

      const ticketDataPromises = allData?.map(async (ticket) => {
        const existingTicket = await TicketSchema.findOne({
          ticket_id: ticket.ticketNumber,
          is_ticket_archieved: false,
        });

        if (existingTicket) {
          existingTicket.is_ticket_archieved = true; // Update the field value
          return existingTicket.save(); // Save the updated ticket
        }
       
      })
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createArchTicket(dataFromExternalSource) {
  try {
    const apiCallTime = new Date();
   
    const accessToken = await getRefreshToken();
    const batchSize = 20
    const allData = [];
  
      const externalData = await axios.get(
        `https://desk.zoho.com/api/v1/tickets/archivedTickets?from=1&limit=100&departmentId=832118000027344117&viewType=1`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      allData.push(...externalData.data.data);
  
   
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

    const ticketDataPromises = allData?.map(async (ticket) => {
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
    const dateString3 = specificData.data.modifiedTime.split('T')[0];
    const lastDepartmentDate = specificData.data.cf.cf_department_transfer_time_1 !== null ? specificData.data.cf.cf_department_transfer_time_1.split('T')[0] : "null";

    const date1 = new Date(dateString1);
    const date2 = new Date(dateString2);
    const date3 = new Date(lastDepartmentDate);
    const date4 = new Date(dateString3);
    const date5 = new Date(apiCallTime.toISOString().split('T')[0]);
   
    const difference = ((date1 - date2)/(1000 * 3600 * 24))+1;
    const lastDepartmentDifference = ((date1 - date3)/(1000 * 3600 * 24))+1;
    const lastTicketTouched = specificData.data.closedTime ? "Already Closed" : ((date5 - date4)/(1000 * 3600 * 24))+1;


    let age_bucket;

    if (difference >= 1 && difference <= 3) {
      age_bucket = "1-3 days";
    } else if(difference >=4 && difference <= 10) {
      age_bucket = "4-10 days"
    } else if(difference >=11 && difference <= 30) {
      age_bucket = "11-30 days"
  } else if(difference >=31 && difference <= 60) {
    age_bucket = "31-60 days"
} else if(difference >= 61 && difference <= 90) {
  age_bucket = "61-90 days"
  } else if (difference >= 91) {
    age_bucket = "More than 90 days"
  }

  let last_department_age_bucket;

  if (lastDepartmentDifference >= 1 && lastDepartmentDifference <= 3) {
    last_department_age_bucket = "1-3 days";
  } else if(lastDepartmentDifference >=4 && lastDepartmentDifference <= 10) {
    last_department_age_bucket = "4-10 days"
  } else if(lastDepartmentDifference >=11 && lastDepartmentDifference <= 30) {
    last_department_age_bucket = "11-30 days"
} else if(lastDepartmentDifference >=31 && lastDepartmentDifference <= 60) {
  last_department_age_bucket = "31-60 days"
} else if(lastDepartmentDifference >= 61 && lastDepartmentDifference <= 90) {
  last_department_age_bucket = "61-90 days"
} else if (lastDepartmentDifference >= 91) {
  last_department_age_bucket = "More than 90 days"
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
          last_touched: lastTicketTouched,
          last_department_age_bucket: last_department_age_bucket !== null ? last_department_age_bucket : "null",
          last_department_ticket_age: lastDepartmentDifference,
          is_ticket_archieved: specificData.data.isArchived,
          department_transfer_time: specificData.data.cf.cf_department_transfer_time_1
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
        existingTicket.last_touched = lastTicketTouched;
        existingTicket.status = ticket.status;
        existingTicket.ticket_subject = ticket.subject;
        existingTicket.resolution = specificData.data.resolution;
        existingTicket.last_modified = specificData.data.modifiedTime;
        existingTicket.severity = specificData.data.customFields["Severity"];
        existingTicket.account_name = accountData.data.accountName;
        existingTicket.age_bucket = age_bucket;
        existingTicket.last_department_ticket_age = lastDepartmentDifference;
        existingTicket.last_department_age_bucket = last_department_age_bucket !== null ? last_department_age_bucket : "null";
        existingTicket.ticket_age = difference;
        existingTicket.is_ticket_archieved = specificData.data.isArchived;
        existingTicket.department_transfer_time = specificData.data.cf.cf_department_transfer_time_1;
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

module.exports = {archivedTickets, createArchTicket};
