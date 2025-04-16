const express = require("express");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const open = require("open");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:4242/callback";

function generateState() {
  return crypto.randomUUID();
}

function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "repo",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

function startLocalServer(expectedState) {
  return new Promise((resolve, reject) => {
    const app = express();
    const port = 4242;

    const server = app.listen(port, () =>
      console.log(`OAuth callback server running at http://localhost:${port}`)
    );

    let finished = false;

    function finish(err, token) {
      if (finished) return;
      finished = true;
      server.close();
      err ? reject(err) : resolve(token);
    }

    app.get("/callback", async (req, res) => {
      const { code, state } = req.query;

      if (!code || !state) {
        console.error("Missing 'code' or 'state' in callback");
        res.status(400).send("Missing 'code' or 'state'");
        return finish(new Error("Missing code or state"));
      }

      if (state !== expectedState) {
        console.error("OAuth state mismatch");
        res.status(400).send("State mismatch");
        return finish(new Error("State mismatch"));
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

        if (!accessToken) {
          res.status(500).send("Failed to obtain access token");
          return finish(new Error("Token not found"));
        }

        res.send("Authentication successful!");
        finish(null, accessToken);
      } catch (err) {
        console.error("OAuth error:", err);
        res.status(500).send("Authentication failed.");
        finish(err);
      }
    });
  });
}

async function OAuth() {
  const state = generateState();
  const authUrl = buildAuthUrl(state);

  try {
    console.log("Opening GitHub OAuth URL in browser");
    await open(authUrl);
    console.log("Waiting for callback...");
    const token = await startLocalServer(state);
    console.log("OAuth complete. Token received.");
    return token;
  } catch (err) {
    console.error("OAuth failed:", err);
    throw err;
  }
}

module.exports = { OAuth };

