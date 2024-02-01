const axios = require("axios");
const TicketSchema = require("../Ticket/Model.js").ticketModel;

async function Ticket(res) {
    try {
        const externalData = await axios.get('https://desk.zoho.com/api/v1/tickets', {
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            Authorization: 'Bearer 1000.a914527443b1979c93622ffb7e79227c.95970fc2d558aecaf0d4b456e7d77451',
          },
        });

        const ticketData = {
          ticket_id: "1234",
          account_name: "Amit",
          status: "Pending",
          // Add more fields as needed
        };
      
        await TicketSchema.create(ticketData);
      
        res.status(200).json({
          status: 200,
          message: 'Ticket Created Successfully',
          data: ticketData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

module.exports = { Ticket };
