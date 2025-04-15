// /api/auth-url.js (Vercel function o backend Express)

export default async function handler(req, res) {
    const CLIENT_ID = process.env.CLIENT_ID;
    const REDIRECT_URI = "https://report-builder-lake.vercel.app"; // oppure https://TUA_APP.vercel.app/api/auth-callback
    const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
    const RESPONSE_TYPE = "code";
  
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`;
  
    res.status(200).json({ url });
  }
  