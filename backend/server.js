import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
app.use(cors());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// STEP 1: restituisce URL di login
app.get('/auth-url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/analytics.manage.users.readonly',
  'https://www.googleapis.com/auth/analytics.manage.users'
    ]
  });
  res.send({ url });
});

// STEP 2: riceve codice, restituisce access token
app.get('/auth-callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send(tokens);
  } catch (err) {
    res.status(500).send({ error: 'Errore nella conversione del codice' });
  }
});

app.listen(3005, () => {
  console.log('✅ Backend avviato su http://localhost:3002');
});