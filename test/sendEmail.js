const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;


const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const refresh_token = process.env.refresh_token;


const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    client_id,
    client_secret,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: refresh_token
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject(err);
      }
      resolve(token);
    });
  });

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.from_email,
      accessToken,
      clientId: client_id,
      clientSecret: client_secret,
      refreshToken: refresh_token
    }
  });
};

//emailOptions - who sends what to whom
const sendEmail = async (emailOptions) => {
  let emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions);
};

sendEmail({
  subject: "Expenses App - Deploy complete!",
  text: "Here goes commit message.",
  to: process.env.from_email,
  from: process.env.from_email
});