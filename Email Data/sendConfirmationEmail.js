const express = require('express');
const axios = require('axios');
const otpGenerator = require('otp-generator')
var UserSchema = require("../Login Function/Model").usermodel;
const crypto = require('crypto');
const userRouter = express();
var CommonFunc = require("../commonfunction");
userRouter.use(express.json());

userRouter.post('/send-confirmation-email', async (req, res) => {
  const email = req.body.email;
  const fullName = req.body.fullName;
  const data = JSON.stringify({
    sender: {
      name: "Amit Varshney",
      email: "amitvarshney30@gmail.com",
    },
    to: [
      {
        email: email,
        name: email,
      },
    ],
    subject: "KIBO - Account Approved Confirmation",
    htmlContent: `
      <html>
      <style>

      img {
        border: none;
        -ms-interpolation-mode: bicubic;
        max-width: 100%; 
      }
      
      body {
        background-color: #eaebed;
        font-family: sans-serif;
        -webkit-font-smoothing: antialiased;
        font-size: 14px;
        line-height: 1.4;
        margin: 0;
        padding: 0;
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%; 
      }
      
      table {
        border-collapse: separate;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        min-width: 100%;
        width: 100%; }
        table td {
          font-family: sans-serif;
          font-size: 14px;
          vertical-align: top; 
      }
      
      /* -------------------------------------
          BODY & CONTAINER
      ------------------------------------- */
      
      .body {
        background-color: #eaebed;
        width: 100%; 
      }
      
      /* Set a max-width, and make it display as block so it will automatically stretch to that width, but will also shrink down on a phone or something */
      .container {
        display: block;
        Margin: 0 auto !important;
        /* makes it centered */
        max-width: 580px;
        padding: 10px;
        width: 580px; 
      }
      
      /* This should also be a block element, so that it will fill 100% of the .container */
      .content {
        box-sizing: border-box;
        display: block;
        Margin: 0 auto;
        max-width: 580px;
        padding: 10px; 
      }
      .main {
        background: #ffffff;
        border-radius: 3px;
        width: 100%; 
      }
      
      .header {
        padding: 20px 0;
      }
      
      .wrapper {
        box-sizing: border-box;
        padding: 20px; 
      }
      
      .content-block {
        padding-bottom: 10px;
        padding-top: 10px;
      }

      h1,
      h2,
      h3,
      h4 {
        color: #06090f;
        font-family: sans-serif;
        font-weight: 400;
        line-height: 1.4;
        margin: 0;
        margin-bottom: 30px; 
      }
      
      h1 {
        font-size: 35px;
        font-weight: 300;
        text-align: center;
        text-transform: capitalize; 
      }
      
      p,
      ul,
      ol {
        font-family: sans-serif;
        font-size: 14px;
        font-weight: normal;
        margin: 0;
        margin-bottom: 15px; 
      }
        p li,
        ul li,
        ol li {
          list-style-position: inside;
          margin-left: 5px; 
      }
      
      a {
        color: #ec0867;
        text-decoration: underline; 
      }
      
      .btn {
        box-sizing: border-box;
        width: 100%; }
        .btn > tbody > tr > td {
          padding-bottom: 15px; }
        .btn table {
          min-width: auto;
          width: auto; 
      }
        .btn table td {
          background-color: #ffffff;
          border-radius: 5px;
          text-align: center; 
      }
        .btn a {
          background-color: #ffffff;
          border: solid 1px #ec0867;
          border-radius: 5px;
          box-sizing: border-box;
          color: #ec0867;
          cursor: pointer;
          display: inline-block;
          font-size: 14px;
          font-weight: bold;
          margin: 0;
          padding: 12px 25px;
          text-decoration: none;
          text-transform: capitalize; 
      }
      
      .btn-primary table td {
        background-color: #ec0867; 
      }
      
      .btn-primary a {
        background-color: #ec0867;
        border-color: #ec0867;
        color: #ffffff; 
      }
      
  
      .last {
        margin-bottom: 0; 
      }
      
      .first {
        margin-top: 0; 
      }
      
      .align-center {
        text-align: center; 
      }
      
      .align-right {
        text-align: right; 
      }
      
      .align-left {
        text-align: left; 
      }
      
      .clear {
        clear: both; 
      }
      
      .mt0 {
        margin-top: 0; 
      }
      
      .mb0 {
        margin-bottom: 0; 
      }
      
      .preheader {
        color: transparent;
        display: none;
        height: 0;
        max-height: 0;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        mso-hide: all;
        visibility: hidden;
        width: 0; 
      }
      
      hr {
        border: 0;
        border-bottom: 1px solid #f6f6f6;
        Margin: 20px 0; 
      }
      
      @media only screen and (max-width: 620px) {
        table[class=body] h1 {
          font-size: 28px !important;
          margin-bottom: 10px !important; 
        }
        table[class=body] p,
        table[class=body] ul,
        table[class=body] ol,
        table[class=body] td,
        table[class=body] span,
        table[class=body] a {
          font-size: 16px !important; 
        }
        table[class=body] .wrapper,
        table[class=body] .article {
          padding: 10px !important; 
        }
        table[class=body] .content {
          padding: 0 !important; 
        }
        table[class=body] .container {
          padding: 0 !important;
          width: 100% !important; 
        }
        table[class=body] .main {
          border-left-width: 0 !important;
          border-radius: 0 !important;
          border-right-width: 0 !important; 
        }
        table[class=body] .btn table {
          width: 100% !important; 
        }
        table[class=body] .btn a {
          width: 100% !important; 
        }
        table[class=body] .img-responsive {
          height: auto !important;
          max-width: 100% !important;
          width: auto !important; 
        }
      }
      
      @media all {
        .ExternalClass {
          width: 100%; 
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%; 
        }
        .apple-link a {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-decoration: none !important; 
        }
        .btn-primary table td:hover {
          background-color: #d5075d !important; 
        }
        .btn-primary a:hover {
          background-color: #d5075d !important;
          border-color: #d5075d !important; 
        } 
      }
      </style>
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Simple Responsive HTML Email With Button</title>
  </head>
  <body class="">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
      <tr>
        <td>&nbsp;</td>
        <td class="container">
          <div class="header">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="align-center" width="100%">
                  <a href="https://kibocommerce.com"><img src="https://mapp.com/wp-content/uploads/2020/10/Kibo-FC-Black.png" height="40" alt="Postdrop"></a>
                </td>
              </tr>
            </table>
          </div>
          <div class="content">

            <!-- START CENTERED WHITE CONTAINER -->
           
            <table role="presentation" class="main">

              <!-- START MAIN CONTENT AREA -->
              <tr>
                <td class="wrapper">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p> Hey ${fullName}</p>
                        <p> Great News! Your request to access Zoho Ticket Portal is approved. </p>
                        <p> Now, you can go ahead and login by clicking on the below button </p>
                        <p> Happy Browsing! </p>
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                          <tbody>
                            <tr>
                              <td align="center">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                  <tbody>
                                    <tr>
                                      <td> <a href="https://kibo-delta.vercel.app" target="_blank">Click here to Login</a> </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            <!-- END MAIN CONTENT AREA -->
            </table>

          <!-- END CENTERED WHITE CONTAINER -->
          </div>
        </td>
        <td>&nbsp;</td>
      </tr>
    </table>
  </body>
</html>`,
    // textContent: "Thank you for registering. Please confirm your account.",
  });

  const config = {
    method: "post",
    url: "https://api.brevo.com/v3/smtp/email",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios(config);
    res.status(200).json({ message: 'Email sent successfully', response: response.data });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});
module.exports = userRouter;
