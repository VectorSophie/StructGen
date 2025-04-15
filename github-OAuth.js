const express = require("express");
const axios = require("axios");
const open = require("open");

const CLIENT_ID = "your-client-id";
const CLIENT_SECRET = "your-client-secret";
const REDIRECT_URI = "http://localhost:4242/callback";

function startAuthServer() {
  return new Promise((resolve, reject) => {
    const app = express();
    const server = app.listen(4242, () => {
      console.log("Readying http://localhost:4242 for GitHub OAuth...");
    });

    app.get("/callback", async (req, res) => {
      const code = req.query.code;
      if (!code) return res.status(400).send("Missing code");

      try {
        const tokenRes = await axios.post(
          "https://github.com/login/oauth/access_token",
          {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
          },
          { headers: { Accept: "application/json" } }
        );

        const accessToken = tokenRes.data.access_token;
        res.send("Authentication complete. Thx!");
        server.close();
        resolve(accessToken);
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function OAuth() {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  await open(authURL);
  const token = await startAuthServer();
  return token;
}

module.exports = { OAuth };
