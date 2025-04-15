export default async function handler(req, res) {
    const redirectUri = "https://report-builder-lake.vercel.app/api/auth-callback";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?...&redirect_uri=${redirectUri}&...`;
    res.status(200).json({ url: authUrl });
  }
  