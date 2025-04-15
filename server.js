// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());

const port = process.env.PORT || 3005;

const redirectUri = process.env.REDIRECT_URI;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// 1️⃣ URL per login Google
app.get("/auth-url", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://www.googleapis.com/auth/analytics.readonly&access_type=offline&prompt=consent`;
  res.json({ url });
});

// 2️⃣ Callback per ricevere il token
app.get("/auth-callback", async (req, res) => {
  const code = req.query.code;

  const result = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const data = await result.json();
  res.json(data);
});

app.listen(port, () => {
  console.log(`✅ Backend avviato su http://localhost:${port}`);
});
