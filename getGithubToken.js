const fs = require("fs");
const path = require("path");
const os = require("os");
const { OAuth } = require("./github-OAuth");

const TOKEN_PATH = path.join(os.homedir(), ".structgen", "token.json");

async function getGithubToken() {
  let token = null;

  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const data = fs.readFileSync(TOKEN_PATH, "utf8");
      const parsed = JSON.parse(data);

      if (parsed && parsed.token) {
        return parsed.token;
      } else {
        console.warn("Token malformed.");
      }
    } catch (err) {
      console.warn("Failed to read token file.");
    }
  }

  token = await OAuth();

  try {
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });

    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify({ token }, null, 2),
      { mode: 0o600 } // user read/write only
    );

    console.log(`GitHub token saved to ${TOKEN_PATH}`);
  } catch (err) {
    console.warn("Failed to save token for later:", err.message);
  }

  return token;
}

module.exports = { getGithubToken };
