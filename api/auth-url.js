export default async function handler(req, res) {
    const CLIENT_ID = process.env.GA_CLIENT_ID;
    const REDIRECT_URI = process.env.GA_REDIRECT_URI;
    const SCOPES = "https://www.googleapis.com/auth/analytics.readonly";
  
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;
  
    res.status(200).json({ url });
  }
  