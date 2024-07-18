const axios = require("axios");
const moment = require('moment');
const AccountSchema = require("./Model").accountModel;

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

async function CreateAccount() {
    try {
      const accessToken = await getRefreshToken();

      let data = []
      let hasMoreData = true
      for (let i = 0; hasMoreData; i+=99) {
      const accountData = await axios.get(
        `https://desk.zoho.com/api/v1/accounts?from=${i}&limit=100`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!accountData.data.data || accountData.data.data.length === 0) {
        hasMoreData = false; // Update flag to stop further API calls
      } else {
        // Concatenate data if available
        data = data.concat(accountData.data.data);
      }
    }
      const accountDataPromise = data.map(async (account) => {
        const existingAccount = await AccountSchema.findOne({ accountId: account.id });
  
        if (!existingAccount) {
          return AccountSchema.create({
            accountId: account.id,
            accountName: account.accountName,
          });
        } else {
          existingAccount.accountName = account.accountName;
          await existingAccount.save();
          return existingAccount;
        }
      });
  
      const allData = await Promise.all(accountDataPromise); // Wait for all agent creations/updates to complete
  
      return {
        status: 200,
        message: "Accounts Saved Successfully",
        data: { allData }
      };
    } catch (error) {
      console.error("Error creating/updating accounts:", error);
      throw error;
    }
  }
  
  async function GetAllAccount() {
    try {
        const accountData = await AccountSchema.find()
if(accountData){
    return{
        status: 200,
        message: "All data Fetched Successfully",
        data: { accountData }
    }
        }
    } catch (error) {
        throw error
    }
  }

module.exports = {CreateAccount, GetAllAccount}