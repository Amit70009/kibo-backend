const axios = require("axios");
const moment = require('moment');
const { intervalToDuration, parseISO } = require('date-fns');
const { get } = require("./Routes.js");
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

async function Ticket(dataFromExternalSource) {
  try {
    const apiCallTime = new Date();
   
    const accessToken = await getRefreshToken();
// console.log(accessToken);
    const agentLimit = 200;
    let agentResponse = [];
    let page = 1;
    let hasMoreAgentData = true;
    const allData = [];
  
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
      allData.push(...externalData.data.data);
   
      while (hasMoreAgentData) {
        const agentsResponse = await axios.get(
          `https://desk.zoho.com/api/v1/agents?limit=${agentLimit}&from=${page}`,
          {
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = agentsResponse.data;
      agentResponse = agentResponse.concat(data.data);

      if (data.data.length < agentLimit) {
        hasMoreAgentData = false;
        // If the number of returned agents is less than the limit, we are done
      } else {
        page += agentLimit; // Otherwise, move to the next page
      }
    }

    const agentsMap = {};
    agentResponse.forEach((agent) => {
      agentsMap[agent.id] = {
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.emailId
      };
    });

    const ticketDataPromises = allData?.map(async (ticket) => {
      const existingTicket = await TicketSchema.findOne({
        ticket_id: ticket.ticket_id,
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
      const ticketMetrics = await axios.get(
        `https://desk.zoho.com/api/v1/tickets/${ticket.id}/metrics`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      let accountData;

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

    if (difference >= 1 && difference <= 7) {
      age_bucket = "0-7 days";
    } else if(difference >=8 && difference <= 15) {
      age_bucket = "8-15 days"
    } else if(difference >=16 && difference <= 30) {
      age_bucket = "16-30 days"
  } else if(difference >=31 && difference <= 60) {
    age_bucket = "31-60 days"
} else if(difference >= 61 && difference <= 90) {
  age_bucket = "61-90 days"
  } else if (difference >= 91) {
    age_bucket = "More than 90 days"
  }

  const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  };
  const timeInMinutes = convertTimeToMinutes(ticketMetrics.data.firstResponseTime.split(' ')[0]);
const thresholdInMinutes = convertTimeToMinutes("24:00");

const FRT = timeInMinutes < thresholdInMinutes ? "Within SLA" : "Out of SLA";

  let last_department_age_bucket;

  if (lastDepartmentDifference >= 1 && lastDepartmentDifference <= 7) {
    last_department_age_bucket = "0-7 days";
  } else if(lastDepartmentDifference >=8 && lastDepartmentDifference <= 15) {
    last_department_age_bucket = "8-15 days"
  } else if(lastDepartmentDifference >=16 && lastDepartmentDifference <= 30) {
    last_department_age_bucket = "16-30 days"
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
          ticket_long_id: ticket.id,
          ticket_url: ticket.webUrl,
          ticket_subject: ticket.subject,
          department: specificData.data.layoutDetails.layoutName,
          email: ticket.email,
          ticket_owner,
          ticket_owner_email,
          account_name: accountData.data.accountName,
          status: ticket.status,
          status_type: ticket.statusType,
          is_trashed: specificData.data.isTrashed,
          customer_last_response_time: ticket.customerResponseTime ?  ticket.customerResponseTime : "null",
          first_response_time: ticketMetrics.data.firstResponseTime ? ticketMetrics.data.firstResponseTime : "null",
          first_response_time_status: FRT ? FRT : 'null',
          created_at: ticket.createdTime,
          resolution: specificData.data.resolution ? specificData.data.resolution : "null",
          last_modified: specificData.data.modifiedTime,
          severity: specificData.data.customFields["Severity"],
          last_update: apiCallTime,
          resolved_at: specificData.data.closedTime,
          ticket_age: difference ? difference : 'null',
          age_bucket: age_bucket ? age_bucket : 'null',
          last_touched: lastTicketTouched ? lastTicketTouched : 'null',
          last_department_age_bucket: last_department_age_bucket !== null ? last_department_age_bucket : "null",
          last_department_ticket_age: lastDepartmentDifference ? lastDepartmentDifference : 'null',
          is_ticket_archieved: specificData.data.isArchived,
          department_transfer_time: specificData.data.cf.cf_department_transfer_time_1 ? specificData.data.cf.cf_department_transfer_time_1 : 'null',
          custom_data: {
            classification: specificData.data.classification ? specificData.data.classification : 'null' ,
            request_escalation: specificData.data.cf.cf_request_escalation,
            escalation_reason: specificData.data.cf.cf_escalation_request_reason ? specificData.data.cf.cf_escalation_request_reason : 'null' ,
            is_sev1: specificData.data.cf.cf_report_sev1,
            resolution_type: specificData.data.cf.cf_resolution_type ? specificData.data.cf.cf_resolution_type : 'null',
            issue_type: specificData.data.cf.cf_issue_type_d1 ? specificData.data.cf.cf_issue_type_d1 : 'null',
            issue_sub_type: specificData.data.cf.cf_issue_sub_type_d2 ? specificData.data.cf.cf_issue_sub_type_d2 : 'null',
            jira_id: specificData.data.cf.cf_jira_issue_id ? specificData.data.cf.cf_jira_issue_id : 'null',
            resolution_owner: specificData.data.cf.cf_resolution_owner_1 ? specificData.data.cf.cf_resolution_owner_1 : 'null',
          },
          department_history: [
            {
              department: "Support",
              start_time: specificData.data.layoutDetails.layoutName === "Support" && 
                          specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined 
                          ? specificData.data.createdTime 
                          : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Support"
                             ? specificData.data.cf.cf_department_transfer_time_1 
                             : apiCallTime.toISOString()),
              
              end_time: specificData.data.layoutDetails.layoutName === "Support" && 
                        specificData.data.closedTime == null && specificData.data.closedTime == undefined
                        ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                           specificData.data.cf.cf_department_transfer_time_1 == undefined
                           ? apiCallTime.toISOString()
                           : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                        : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime),
            
total_time: intervalToDuration({start: specificData.data.layoutDetails.layoutName === "Support" && 
  specificData.data.cf.cf_department_transfer_time_1 == null && 
  specificData.data.cf.cf_department_transfer_time_1 == undefined 
  ? specificData.data.createdTime 
  : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Support"
     ? specificData.data.cf.cf_department_transfer_time_1 
     : apiCallTime.toISOString()), end: specificData.data.layoutDetails.layoutName === "Support" && 
     specificData.data.closedTime == null && specificData.data.closedTime == undefined
     ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
        specificData.data.cf.cf_department_transfer_time_1 == undefined
        ? apiCallTime.toISOString()
        : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
     : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime)})
                      },
            {
              department: "Professional Services",
              start_time: specificData.data.layoutDetails.layoutName === "Professional Services" && 
                          specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined 
                          ? specificData.data.createdTime 
                          : (specificData.data.cf.cf_department_transfer_time_1 !== null &&  specificData.data.layoutDetails.layoutName === "Professional Services"
                             ? specificData.data.cf.cf_department_transfer_time_1 
                             : apiCallTime.toISOString()),
              
              end_time: specificData.data.layoutDetails.layoutName === "Professional Services" && 
              specificData.data.closedTime == null && specificData.data.closedTime == undefined
                        ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined
                          ? apiCallTime.toISOString()
                          : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                           : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime),
            
            total_time: intervalToDuration({start: specificData.data.layoutDetails.layoutName === "Professional Services" && 
              specificData.data.cf.cf_department_transfer_time_1 == null && 
              specificData.data.cf.cf_department_transfer_time_1 == undefined 
              ? specificData.data.createdTime 
              : (specificData.data.cf.cf_department_transfer_time_1 !== null &&  specificData.data.layoutDetails.layoutName === "Professional Services"
                 ? specificData.data.cf.cf_department_transfer_time_1 
                 : apiCallTime.toISOString()), end: specificData.data.layoutDetails.layoutName === "Professional Services" && 
                 specificData.data.closedTime == null && specificData.data.closedTime == undefined
                           ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                             specificData.data.cf.cf_department_transfer_time_1 == undefined
                             ? apiCallTime.toISOString()
                             : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                              : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime)})
                          },
            {
              department: "Engineering",
              start_time: specificData.data.layoutDetails.layoutName === "Engineering" && 
                          specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined 
                          ? specificData.data.createdTime 
                          : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Engineering"
                             ? specificData.data.cf.cf_department_transfer_time_1 
                             : apiCallTime.toISOString()),
              
              end_time: specificData.data.layoutDetails.layoutName === "Engineering" && 
              specificData.data.closedTime == null && specificData.data.closedTime == undefined
                        ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined
                          ? apiCallTime.toISOString()
                          : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                           : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime),

                           total_time: intervalToDuration({start: specificData.data.layoutDetails.layoutName === "Engineering" && 
                            specificData.data.cf.cf_department_transfer_time_1 == null && 
                            specificData.data.cf.cf_department_transfer_time_1 == undefined 
                            ? specificData.data.createdTime 
                            : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Engineering"
                               ? specificData.data.cf.cf_department_transfer_time_1 
                               : apiCallTime.toISOString()), end: specificData.data.layoutDetails.layoutName === "Engineering" && 
                               specificData.data.closedTime == null && specificData.data.closedTime == undefined
                                         ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                                           specificData.data.cf.cf_department_transfer_time_1 == undefined
                                           ? apiCallTime.toISOString()
                                           : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                                            : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime)})
            },
            {
              department: "Product",
              start_time: specificData.data.layoutDetails.layoutName === "Product" && 
                          specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined
                          ? specificData.data.createdTime 
                          : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Product"
                             ? specificData.data.cf.cf_department_transfer_time_1 
                             : apiCallTime.toISOString()),
              
              end_time: specificData.data.layoutDetails.layoutName === "Product" && 
              specificData.data.closedTime == null && specificData.data.closedTime == undefined
                        ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined
                          ? apiCallTime.toISOString()
                          : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                           : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime),
            
            total_time: intervalToDuration({start: specificData.data.layoutDetails.layoutName === "Product" && 
              specificData.data.cf.cf_department_transfer_time_1 == null && 
              specificData.data.cf.cf_department_transfer_time_1 == undefined
              ? specificData.data.createdTime 
              : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Product"
                 ? specificData.data.cf.cf_department_transfer_time_1 
                 : apiCallTime.toISOString()), end: specificData.data.layoutDetails.layoutName === "Product" && 
                 specificData.data.closedTime == null && specificData.data.closedTime == undefined
                           ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                             specificData.data.cf.cf_department_transfer_time_1 == undefined
                             ? apiCallTime.toISOString()
                             : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                              : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime)})
                          },
            {
              department: "Devops",
              start_time: specificData.data.layoutDetails.layoutName === "Devops" && 
                          specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined
                          ? specificData.data.createdTime 
                          : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Devops"
                             ? specificData.data.cf.cf_department_transfer_time_1 
                             : apiCallTime.toISOString()),
              
              end_time: specificData.data.layoutDetails.layoutName === "Devops" && 
              specificData.data.closedTime == null && specificData.data.closedTime == undefined
                        ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                          specificData.data.cf.cf_department_transfer_time_1 == undefined
                          ? apiCallTime.toISOString()
                          : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                           : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime),
            
            total_time: intervalToDuration({start: specificData.data.layoutDetails.layoutName === "Devops" && 
              specificData.data.cf.cf_department_transfer_time_1 == null && 
              specificData.data.cf.cf_department_transfer_time_1 == undefined
              ? specificData.data.createdTime 
              : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Devops"
                 ? specificData.data.cf.cf_department_transfer_time_1 
                 : apiCallTime.toISOString()), end: specificData.data.layoutDetails.layoutName === "Devops" && 
                 specificData.data.closedTime == null && specificData.data.closedTime == undefined
                           ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                             specificData.data.cf.cf_department_transfer_time_1 == undefined
                             ? apiCallTime.toISOString()
                             : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                              : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime)})
                          },
                          {
                            department: "Evaluation Questions",
                            start_time: specificData.data.layoutDetails.layoutName === "Evaluation Questions" && 
                                        specificData.data.cf.cf_department_transfer_time_1 == null && 
                                        specificData.data.cf.cf_department_transfer_time_1 == undefined 
                                        ? specificData.data.createdTime 
                                        : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Evaluation Questions"
                                           ? specificData.data.cf.cf_department_transfer_time_1 
                                           : apiCallTime.toISOString()),
                            
                            end_time: specificData.data.layoutDetails.layoutName === "Evaluation Questions" && 
                            specificData.data.closedTime == null && specificData.data.closedTime == undefined
                                      ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                                        specificData.data.cf.cf_department_transfer_time_1 == undefined
                                        ? apiCallTime.toISOString()
                                        : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                                         : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime),
              
                                         total_time: intervalToDuration({start: specificData.data.layoutDetails.layoutName === "Evaluation Questions" && 
                                          specificData.data.cf.cf_department_transfer_time_1 == null && 
                                          specificData.data.cf.cf_department_transfer_time_1 == undefined 
                                          ? specificData.data.createdTime 
                                          : (specificData.data.cf.cf_department_transfer_time_1 !== null && specificData.data.layoutDetails.layoutName === "Evaluation Questions"
                                             ? specificData.data.cf.cf_department_transfer_time_1 
                                             : apiCallTime.toISOString()), end: specificData.data.layoutDetails.layoutName === "Evaluation Questions" && 
                                             specificData.data.closedTime == null && specificData.data.closedTime == undefined
                                                       ? (specificData.data.cf.cf_department_transfer_time_1 == null && 
                                                         specificData.data.cf.cf_department_transfer_time_1 == undefined
                                                         ? apiCallTime.toISOString()
                                                         : (specificData.data.cf.cf_department_transfer_time_1 > apiCallTime ? specificData.data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
                                                          : (specificData.data.closedTime == null && specificData.data.closedTime == undefined ? apiCallTime.toISOString() : specificData.data.closedTime)})
                          },
          ]          
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
        existingTicket.ticket_long_id = ticket.id;
        existingTicket.resolved_at = specificData.data.closedTime;
        existingTicket.ticket_owner = ticket_owner;
        existingTicket.department = specificData.data.layoutDetails.layoutName;
        existingTicket.ticket_owner_email = ticket_owner_email;
        existingTicket.last_touched = lastTicketTouched ? lastTicketTouched : 'null';
        existingTicket.status = ticket.status;
        existingTicket.status_type = ticket.statusType;
        existingTicket.is_trashed = specificData.data.isTrashed;
        existingTicket.customer_last_response_time = ticket.customerResponseTime ? ticket.customerResponseTime : 'null';
        existingTicket.first_response_time = ticketMetrics.data.firstResponseTime ? ticketMetrics.data.firstResponseTime : 'null';
        existingTicket.first_response_time_status = FRT ? FRT : 'null';
        existingTicket.ticket_subject = ticket.subject;
        existingTicket.resolution = specificData.data.resolution ? specificData.data.resolution : 'null';
        existingTicket.last_modified = specificData.data.modifiedTime ? specificData.data.modifiedTime : 'null';
        existingTicket.severity = specificData.data.customFields["Severity"];
        existingTicket.account_name = accountData.data.accountName;
        existingTicket.age_bucket = age_bucket ? age_bucket : 'null';
        existingTicket.last_department_ticket_age = lastDepartmentDifference ? lastDepartmentDifference : 'null';
        existingTicket.last_department_age_bucket = last_department_age_bucket ? last_department_age_bucket : "null";
        existingTicket.ticket_age = difference ? difference : 'null';
        existingTicket.is_ticket_archieved = specificData.data.isArchived;
        existingTicket.department_transfer_time = specificData.data.cf.cf_department_transfer_time_1 ? specificData.data.cf.cf_department_transfer_time_1 : 'null';
        existingTicket.custom_data = {
          classification: specificData.data.classification ? specificData.data.classification : 'null' ,
            request_escalation: specificData.data.cf.cf_request_escalation,
            escalation_reason: specificData.data.cf.cf_escalation_request_reason ? specificData.data.cf.cf_escalation_request_reason : 'null' ,
            is_sev1: specificData.data.cf.cf_report_sev1,
            resolution_type: specificData.data.cf.cf_resolution_type ? specificData.data.cf.cf_resolution_type : 'null',
            issue_type: specificData.data.cf.cf_issue_type_d1 ? specificData.data.cf.cf_issue_type_d1 : 'null',
            issue_sub_type: specificData.data.cf.cf_issue_sub_type_d2 ? specificData.data.cf.cf_issue_sub_type_d2 : 'null',
            jira_id: specificData.data.cf.cf_jira_issue_id ? specificData.data.cf.cf_jira_issue_id : 'null',
            resolution_owner: specificData.data.cf.cf_resolution_owner_1 ? specificData.data.cf.cf_resolution_owner_1 : 'null',
        }
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
      message: "Tickets Created Successfully",
      data: { createdTickets },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function GetAllData(data) {
  try {
      const {
          start_date,
          ticket_id,
          end_date,
          resolved_start_date,
          resolved_end_date,
          ticket_owner_email,
          account_name,
          status,
          severity,
          created_start_date,
          created_end_date,
          department,
          is_ticket_archieved,
          ...otherParams
      } = data;

      const startDate = start_date ? moment(start_date).toDate() : new Date("2020-01-01T00:00:00.000Z");
      const endDate = end_date ? moment(end_date).toDate() : new Date();
      const createdStartDate = created_start_date ? moment(created_start_date).toDate() : new Date("2020-01-01T00:00:00.000Z");
      const createdEndDate = created_end_date ? moment(created_end_date).toDate() : new Date();
      const resolvedStartDate = resolved_start_date ? moment(resolved_start_date).toDate() : undefined;
      const resolvedEndDate = resolved_end_date ? moment(resolved_end_date).toDate() : undefined;

      const query = {
          ...otherParams, // Include other query parameters
          last_modified: { $gte: startDate, $lte: endDate },
          created_at: { $gte: createdStartDate, $lte: createdEndDate }
      };

      // Apply filters based on provided parameters
      if (ticket_owner_email) {
          const ticketOwners = ticket_owner_email.split(',').map(owner => owner.trim());
          query.ticket_owner_email = { $in: ticketOwners };
      }

      if (resolvedStartDate && resolvedEndDate) {
        query.resolved_at = { $gte: resolvedStartDate, $lte: resolvedEndDate };
      }

      if (department) {
          const departments = department.split(',').map(dep => dep.trim());
          query.department = { $in: departments };
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

      if (ticket_id) {
        const ticket_ID = ticket_id.split(',').map(id => id.trim());
        query.ticket_id = { $in: ticket_ID };
    }

      if (is_ticket_archieved !== 'all') {
          if (is_ticket_archieved !== undefined) {
              query.is_ticket_archieved = is_ticket_archieved; // Apply the filter if provided and not 'all'
          }
      }

      const ticketData = await TicketSchema.find(query);
      if (ticketData) {
          return {
              status: 200,
              message: "All data fetched successfully",
              data: { ticketData }
          };
      }
  } catch (error) {
      console.log(error);
      throw error;
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

async function FetchAllAgent() {
  try {
      var fetchAllUser = await TicketSchema.find()
      if(fetchAllUser){
          return {
              status: 200,
              message: "All Agent Fetched Successfully",
              data: {fetchAllUser}
            };
      }
  } catch (error) {
      console.log(error);
      throw error
  }
}

async function FetchAllClient() {
  
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

async function UpdateTicketTime() {
  const statuses = ["Unassigned", "Pending Client", "Escalated", "Unassigned", "Engineering", 
    "Product", "Accepted", "Assigned", "PSE", "Pending Review", 
    "Pending Contract", "Pending Client/Partner", "Waiting for Code Change", 
    "Pending Prioritization", "With Agent"];

 // Function to add durations and normalize
 function addDurations(duration1 = {}, duration2 = {}) {
  // Convert durations to total seconds
  const toSeconds = (duration) => {
    return (duration.years || 0) * 31536000 + 
           (duration.months || 0) * 2592000 + 
           (duration.days || 0) * 86400 +     
           (duration.hours || 0) * 3600 +     
           (duration.minutes || 0) * 60 +   
           (duration.seconds || 0);        
  };

  // Normalize a duration object
  function normalizeDuration(totalSeconds) {
    const years = Math.floor(totalSeconds / 31536000);
    totalSeconds %= 31536000;
    
    const months = Math.floor(totalSeconds / 2592000);
    totalSeconds %= 2592000;
    
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return { years, months, days, hours, minutes, seconds };
  }

  // Calculate total seconds for both durations
  const totalSeconds1 = toSeconds(duration1);
  const totalSeconds2 = toSeconds(duration2);

  // Sum the total seconds
  const totalSeconds = totalSeconds1 + totalSeconds2;

  // Normalize the result
  return normalizeDuration(totalSeconds);
}


  try {
    const OpenTicketData = await TicketSchema.find({ status: { $in: statuses } });
    const accessToken = await getRefreshToken();
    const apiCallTime = new Date();
    const pLimit = await import('p-limit').then(mod => mod.default);
    const limit = pLimit(25);
    const fetchData = async (ticket) => {
      try {
        const ticketData = await axios.get(`https://desk.zoho.com/api/v1/tickets/${ticket.ticket_long_id}`, {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = ticketData.data;
        const currentTicket = await TicketSchema.findOne({ ticket_id: data.ticketNumber });
        const lastSupportTotalTime = currentTicket?.department_history[0]?.total_time
        const lastSupportStartTime = currentTicket?.department_history[0]?.start_time
        const lastSupportEndTime = currentTicket?.department_history[0]?.end_time
        const lastPSTotalTime = currentTicket?.department_history[1]?.total_time
        const lastPSStartTime = currentTicket?.department_history[1]?.start_time
        const lastPSEndTime = currentTicket?.department_history[1]?.end_time
        const lastEngineeringTotalTime = currentTicket?.department_history[2]?.total_time
        const lastEngineeringStartTime = currentTicket?.department_history[2]?.start_time
        const lastEngineeringEndTime = currentTicket?.department_history[2]?.end_time
        const lastProductTotalTime = currentTicket?.department_history[3]?.total_time
        const lastProductStartTime = currentTicket?.department_history[3]?.start_time
        const lastProductEndTime = currentTicket?.department_history[3]?.end_time
        const lastDevopsTotalTime = currentTicket?.department_history[4]?.total_time
        const lastDevopsStartTime = currentTicket?.department_history[4]?.start_time
        const lastDevopsEndTime = currentTicket?.department_history[4]?.end_time
        const lastEqTotalTime = currentTicket?.department_history[5]?.total_time
        const lastEqStartTime = currentTicket?.department_history[5]?.start_time
        const lastEqEndTime = currentTicket?.department_history[5]?.end_time

        const newSupportStartTime = data.layoutDetails.layoutName === "Support" && 
          (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined) 
          ? data.createdTime 
          : (data.cf.cf_department_transfer_time_1 !== null && data.layoutDetails.layoutName === "Support"
             ? data.cf.cf_department_transfer_time_1 
             : apiCallTime.toISOString());

        const newSupportEndTime = data.layoutDetails.layoutName === "Support" && 
          (data.closedTime == null || data.closedTime === undefined)
          ? (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined
             ? apiCallTime.toISOString()
             : (data.cf.cf_department_transfer_time_1 > apiCallTime ? data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
          : (data.closedTime == null || data.closedTime === undefined ? apiCallTime.toISOString() : data.closedTime);

        const CalculateSupStartTime = (newSupportStartTime == lastSupportStartTime) ? lastSupportEndTime : (newSupportStartTime == newSupportEndTime ? newSupportEndTime : data.cf.cf_department_transfer_time_1)
        const CalculateSupEndTime = data.layoutDetails.layoutName != "Support" ? data.cf.cf_department_transfer_time_1 : newSupportEndTime
        const newSupportDifference = data.layoutDetails.layoutName == "Support"  ? intervalToDuration({
          start: new Date(CalculateSupStartTime),
          end: new Date(newSupportEndTime)
        }) : ( CalculateSupEndTime > lastSupportEndTime && lastSupportEndTime == CalculateSupEndTime? intervalToDuration({
          start: new Date(lastSupportEndTime),
          end: new Date(CalculateSupEndTime)
        }) : {})

        const updatedSupTotalTime = addDurations(lastSupportTotalTime, newSupportDifference);
       
        const newPSStartTime = data.layoutDetails.layoutName === "Professional Services" && 
          (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined) 
          ? data.createdTime 
          : (data.cf.cf_department_transfer_time_1 !== null && data.layoutDetails.layoutName === "Professional Services"
             ? data.cf.cf_department_transfer_time_1 
             : apiCallTime.toISOString());


        const newPSEndTime = data.layoutDetails.layoutName === "Professional Services" && 
          (data.closedTime == null || data.closedTime === undefined)
          ? (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined
             ? apiCallTime.toISOString()
             : (data.cf.cf_department_transfer_time_1 > apiCallTime ? data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
          : (data.closedTime == null || data.closedTime === undefined ? apiCallTime.toISOString() : data.closedTime);

        // Calculate the new difference
        const CalculatePSStartTime = (newPSStartTime == lastPSStartTime) ? lastPSEndTime : (newPSStartTime == newPSEndTime ? newPSEndTime : data.cf.cf_department_transfer_time_1)
        const CalculatePSEndTime = data.layoutDetails.layoutName != "Professional Services" ? data.cf.cf_department_transfer_time_1 : newPSEndTime
        const newPSDifference = data.layoutDetails.layoutName == "Professional Services"  ? intervalToDuration({
          start: new Date(CalculatePSStartTime),
          end: new Date(newPSEndTime)
        }) : ( CalculatePSEndTime > lastPSEndTime && lastPSEndTime == CalculatePSEndTime? intervalToDuration({
          start: new Date(lastPSEndTime),
          end: new Date(CalculatePSEndTime)
        }) : {})

        const updatedPSETotalTime = addDurations(lastPSTotalTime, newPSDifference )

        const newEngineeringStartTime = data.layoutDetails.layoutName === "Engineering" && 
        (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined) 
        ? data.createdTime 
        : (data.cf.cf_department_transfer_time_1 !== null && data.layoutDetails.layoutName === "Engineering"
           ? data.cf.cf_department_transfer_time_1 
           : apiCallTime.toISOString());

      const newEngineeringEndTime = data.layoutDetails.layoutName === "Engineering" && 
        (data.closedTime == null || data.closedTime === undefined)
        ? (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined
           ? apiCallTime.toISOString()
           : (data.cf.cf_department_transfer_time_1 > apiCallTime ? data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
        : (data.closedTime == null || data.closedTime === undefined ? apiCallTime.toISOString() : data.closedTime);

        const CalculateEngineeringStartTime = (newEngineeringStartTime == lastEngineeringStartTime) ? lastEngineeringEndTime : (newEngineeringStartTime == newEngineeringEndTime ? newEngineeringEndTime : data.cf.cf_department_transfer_time_1)
        const CalculateEngineeringEndTime = data.layoutDetails.layoutName != "Engineering" ? data.cf.cf_department_transfer_time_1 : newEngineeringEndTime
        const newEngineeringDifference = data.layoutDetails.layoutName == "Engineering"  ? intervalToDuration({
          start: new Date(CalculateEngineeringStartTime),
          end: new Date(newEngineeringEndTime)
        }) : ( CalculateEngineeringEndTime > lastEngineeringEndTime && lastEngineeringEndTime == CalculateEngineeringEndTime ? intervalToDuration({
          start: new Date(lastEngineeringEndTime),
          end: new Date(CalculateEngineeringEndTime)
        }) : {})

      const updatedEngineeringTotalTime = addDurations(lastEngineeringTotalTime, newEngineeringDifference);

      const newDevopsStartTime = data.layoutDetails.layoutName === "Devops" && 
      (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined) 
      ? data.createdTime 
      : (data.cf.cf_department_transfer_time_1 !== null && data.layoutDetails.layoutName === "Devops"
         ? data.cf.cf_department_transfer_time_1 
         : apiCallTime.toISOString());

    const newDevopsEndTime = data.layoutDetails.layoutName === "Devops" && 
      (data.closedTime == null || data.closedTime === undefined)
      ? (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined
         ? apiCallTime.toISOString()
         : (data.cf.cf_department_transfer_time_1 > apiCallTime ? data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
      : (data.closedTime == null || data.closedTime === undefined ? apiCallTime.toISOString() : data.closedTime);

      const CalculateDevopsStartTime = (newDevopsStartTime == lastDevopsStartTime) ? lastDevopsEndTime : (newDevopsStartTime == newDevopsEndTime ? newDevopsEndTime : data.cf.cf_department_transfer_time_1)
      const CalculateDevopsEndTime = data.layoutDetails.layoutName != "Devops" ? data.cf.cf_department_transfer_time_1 : newDevopsEndTime
      const newDevopsDifference = data.layoutDetails.layoutName == "Devops"  ? intervalToDuration({
        start: new Date(CalculateDevopsStartTime),
        end: new Date(newDevopsEndTime)
      }) : ( CalculateDevopsEndTime > lastDevopsEndTime && lastDevopsEndTime == CalculateDevopsEndTime ? intervalToDuration({
        start: new Date(lastDevopsEndTime),
        end: new Date(CalculateDevopsEndTime)
      }) : {})

    const updatedDevopsTotalTime = addDurations(lastDevopsTotalTime, newDevopsDifference);

    const newProductStartTime = data.layoutDetails.layoutName === "Product" && 
    (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined) 
    ? data.createdTime 
    : (data.cf.cf_department_transfer_time_1 !== null && data.layoutDetails.layoutName === "Product"
       ? data.cf.cf_department_transfer_time_1 
       : apiCallTime.toISOString());

  const newProductEndTime = data.layoutDetails.layoutName === "Product" && 
    (data.closedTime == null || data.closedTime === undefined)
    ? (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined
       ? apiCallTime.toISOString()
       : (data.cf.cf_department_transfer_time_1 > apiCallTime ? data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
    : (data.closedTime == null || data.closedTime === undefined ? apiCallTime.toISOString() : data.closedTime);

    const CalculateProductStartTime = (newProductStartTime == lastProductStartTime) ? lastProductEndTime : (newProductStartTime == newProductEndTime ? newProductEndTime : data.cf.cf_department_transfer_time_1)
    const CalculateProductEndTime = data.layoutDetails.layoutName != "Product" ? data.cf.cf_department_transfer_time_1 : newProductEndTime
    const newProductDifference = data.layoutDetails.layoutName == "Product"  ? intervalToDuration({
      start: new Date(CalculateProductStartTime),
      end: new Date(newProductEndTime)
    }) : ( CalculateProductEndTime > lastProductEndTime && lastProductEndTime == CalculateProductEndTime ? intervalToDuration({
      start: new Date(lastProductEndTime),
      end: new Date(CalculateProductEndTime)
    }) : {})

  const updatedProductTotalTime = addDurations(lastProductTotalTime, newProductDifference);

  const newEqStartTime = data.layoutDetails.layoutName === "Evaluation Questions" && 
  (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined) 
  ? data.createdTime 
  : (data.cf.cf_department_transfer_time_1 !== null && data.layoutDetails.layoutName === "Evaluation Questions"
     ? data.cf.cf_department_transfer_time_1 
     : apiCallTime.toISOString());

const newEqEndTime = data.layoutDetails.layoutName === "Evaluation Questions" && 
  (data.closedTime == null || data.closedTime === undefined)
  ? (data.cf.cf_department_transfer_time_1 == null || data.cf.cf_department_transfer_time_1 === undefined
     ? apiCallTime.toISOString()
     : (data.cf.cf_department_transfer_time_1 > apiCallTime ? data.cf.cf_department_transfer_time_1 : apiCallTime.toISOString()))
  : (data.closedTime == null || data.closedTime === undefined ? apiCallTime.toISOString() : data.closedTime);

  const CalculateEqStartTime = (newEqStartTime == lastEqStartTime) ? lastEqEndTime : (newEqStartTime == newEqEndTime ? newEqEndTime : data.cf.cf_department_transfer_time_1)
  const CalculateEqEndTime = data.layoutDetails.layoutName != "Evaluation Questions" ? data.cf.cf_department_transfer_time_1 : newEqEndTime
  const newEqDifference = data.layoutDetails.layoutName == "Evaluation Questions"  ? intervalToDuration({
    start: new Date(CalculateEqStartTime),
    end: new Date(newEqEndTime)
  }) : ( CalculateEqEndTime > lastEqEndTime && lastEqEndTime == CalculateEqEndTime ? intervalToDuration({
    start: new Date(lastEqEndTime),
    end: new Date(CalculateEqEndTime)
  }) : {})


const updatedEqTotalTime = addDurations(lastEqTotalTime, newEqDifference);
       
        const updateSupportResult = await TicketSchema.findOneAndUpdate(
          { ticket_id: data.ticketNumber , "department_history.department": "Support" },
          {
            $set: {
              "department_history.$.start_time": newSupportStartTime,
              "department_history.$.end_time": newSupportEndTime,
              "department_history.$.total_time": updatedSupTotalTime
            }
          },
          { new: true }
        );

        const updatePSResult = await TicketSchema.findOneAndUpdate(
          { ticket_id: data.ticketNumber, "department_history.department": "Professional Services" },
          {
            $set: {
              "department_history.$.start_time": newPSStartTime,
              "department_history.$.end_time": newPSEndTime,
              "department_history.$.total_time": updatedPSETotalTime
            }
          },
          { new: true }
        );
        const updateProductResult = await TicketSchema.findOneAndUpdate(
          { ticket_id: data.ticketNumber, "department_history.department": "Product" },
          {
            $set: {
              "department_history.$.start_time": newProductStartTime,
              "department_history.$.end_time": newProductEndTime,
              "department_history.$.total_time": updatedProductTotalTime
            }
          },
          { new: true }
        );
        const updateEngineeringResult = await TicketSchema.findOneAndUpdate(
          { ticket_id: data.ticketNumber, "department_history.department": "Engineering" },
          {
            $set: {
              "department_history.$.start_time": newEngineeringStartTime,
              "department_history.$.end_time": newEngineeringEndTime,
              "department_history.$.total_time": updatedEngineeringTotalTime
            }
          },
          { new: true }
        );

        const updateDevopsResult = await TicketSchema.findOneAndUpdate(
          { ticket_id: data.ticketNumber, "department_history.department": "Devops" },
          {
            $set: {
              "department_history.$.start_time": newDevopsStartTime,
              "department_history.$.end_time": newDevopsEndTime,
              "department_history.$.total_time": updatedDevopsTotalTime
            }
          },
          { new: true }
        );

        const updateEqResult = await TicketSchema.findOneAndUpdate(
          { ticket_id: data.ticketNumber , "department_history.department": "Evaluation Questions" },
          {
            $set: {
              "department_history.$.start_time": newEqStartTime,
              "department_history.$.end_time": newEqEndTime,
              "department_history.$.total_time": updatedEqTotalTime
            }
          },
          { new: true }
        );
      } catch (error) {
        console.error(`Error fetching data for ticket ${ticket.ticket_long_id}:`, error);
      }
    };

    const tasks = OpenTicketData.map(ticket => limit(() => fetchData(ticket)));
    await Promise.all(tasks);

  } catch (error) {
    console.error('Error updating ticket time:', error);
  }
}


module.exports = {Ticket, GetAllData, AccountName, AgentName, FetchAllAgent, FetchAllClient, UpdateTicketTime};