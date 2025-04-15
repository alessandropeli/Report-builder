export default async function handler(req, res) {
    const code = req.query.code;
  
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GA_CLIENT_ID,
        client_secret: process.env.GA_CLIENT_SECRET,
        redirect_uri: process.env.GA_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });
  
    const data = await response.json();
    res.status(200).json(data);
  }
  