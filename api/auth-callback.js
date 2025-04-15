export default async function handler(req, res) {
  const code = req.query.code;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: "https://report-builder-lake.vercel.app/api/auth-callback",
      grant_type: "authorization_code"
    })
  });

  const tokenData = await tokenResponse.json();
  res.status(200).json(tokenData);
}
