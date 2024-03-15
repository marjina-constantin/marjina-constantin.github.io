const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    client_id,
    client_secret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: refresh_token,
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
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.FROM_EMAIL,
      accessToken,
      clientId: client_id,
      clientSecret: client_secret,
      refreshToken: refresh_token,
    },
  });
};

//emailOptions - who sends what to whom
const sendEmail = async (emailOptions) => {
  let emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions);
};

sendEmail({
  subject: 'Expenses App - Deploy complete!',
  text: `The following feature/fix has been deployed: ${process.argv[2]}`,
  to: process.env.FROM_EMAIL,
  from: process.env.FROM_EMAIL,
});
