// /api/auth-url.js

export default async function handler(req, res) {
    const CLIENT_ID = process.env.CLIENT_ID;
    const REDIRECT_URI = process.env.REDIRECT_URI; // Deve corrispondere a quello autorizzato in Google Console
  
    const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
    const RESPONSE_TYPE = "code";
    const ACCESS_TYPE = "offline";
    const PROMPT = "consent";
  
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPE)}&access_type=${ACCESS_TYPE}&prompt=${PROMPT}`;
  
    res.status(200).json({ url });
  }
  