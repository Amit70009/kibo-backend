const axios = require("axios");
const moment = require('moment');
const AgentSchema = require("./Model").agentModel;

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
        timestamp: moment(), 
      };
    }
    return refreshTokenData.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

async function CreateAgent() {
    try {
      const accessToken = await getRefreshToken();

      let data = []
      let hasMoreData = true
      for (let i = 0; hasMoreData; i+=199) {
      const agentData = await axios.get(
        `https://desk.zoho.com/api/v1/agents?from=${i}&limit=200`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!agentData.data.data || agentData.data.data.length === 0) {
        hasMoreData = false; // Update flag to stop further API calls
      } else {
        // Concatenate data if available
        data = data.concat(agentData.data.data);
      }
    }
      const agentDataPromises = data.map(async (agent) => {
        const existingAgent = await AgentSchema.findOne({ agentId: agent.id });
  
        if (!existingAgent) {
          return AgentSchema.create({
            agentId: agent.id,
            agentName: agent.name,
            agentEmail: agent.emailId,
            agentStatus: agent.status,
            isConfirmed: agent.isConfirmed,
            agentRoleId: agent.roleId,
            departmentId: agent.associatedDepartmentIds,
          });
        } else {
          existingAgent.agentName = agent.name;
          existingAgent.agentEmail = agent.emailId;
          existingAgent.agentStatus = agent.status;
          existingAgent.isConfirmed = agent.isConfirmed;
          existingAgent.agentRoleId = agent.roleId;
          existingAgent.departmentId = agent.associatedDepartmentIds;
          await existingAgent.save();
          return existingAgent;
        }
      });
  
      const allData = await Promise.all(agentDataPromises); // Wait for all agent creations/updates to complete
  
      return {
        status: 200,
        message: "Agents Saved Successfully",
        data: allData
      };
    } catch (error) {
      console.error("Error creating/updating agents:", error);
      throw error;
    }
  }

  async function GetAllAgent() {
    try {
        const agentData = await AgentSchema.find()
if(agentData){
    return{
        status: 200,
        message: "All Agent Fetched Successfully",
        data: {agentData}
    }
        }
    } catch (error) {
        throw error
    }
  }
  

module.exports = {CreateAgent, GetAllAgent}