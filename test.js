(async () => {
    const open = (await import("open")).default;
  
    const authURL = "https://github.com/login/oauth/authorize";
    try {
      await open(authURL);
      console.log("Browser opened successfully!");
    } catch (err) {
      console.error("Failed to open browser:", err);
    }
  })();
  
