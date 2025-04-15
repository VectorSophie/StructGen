const express = require("express");
const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:4242/callback";

function startAuthServer() {
  return new Promise((resolve, reject) => {
    const app = express();
    const server = app.listen(4242, () => {
      console.log("Ready for GitHub OAuth at http://localhost:4242...");
    });

    app.get("/callback", async (req, res) => {
      const code = req.query.code;
      if (!code) {
        console.error("Missing code in callback");
        return res.status(400).send("Missing code");
      }

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
        res.send("Authentication complete. Thanks!");
        server.close();
        resolve(accessToken);
      } catch (err) {
        console.error("Error during authentication:", err);
        reject(err);
      }
    });
  });
}

async function OAuth() {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;

  try {
    console.log("Opening GitHub OAuth URL...");
    const open = (await import("open")).default;
    await open(authURL);
    console.log("Browser opened successfully.");
  } catch (err) {
    console.error("Error opening browser:", err);
    throw new Error("Failed to open browser for authentication");
  }

  const token = await startAuthServer();
  return token;
}

module.exports = { OAuth };
