import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import morgan from "morgan";

const app = express();
const port = 3004;

// Enable CORS
app.use(cors());
app.use(express.json());

// Use morgan for logging HTTP requests
app.use(morgan("combined"));

app.post("/api/token", async (req, res) => {
  const { code, codeVerifier, clientId, clientSecret, baseUrl, redirectUrl } =
    req.body;
  const url = `${baseUrl}/oauth2/v1/token`;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  console.log("Auth", auth);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${auth}`,
  };
  let body = `grant_type=authorization_code&redirect_uri=${redirectUrl}&code=${code}`;
  // Add codeVerifier for PKCE enabled apps
  if (codeVerifier) {
    body = `${body}&code_verifier=${codeVerifier}`;
  }
  console.log("Request body:", body);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response text:", errorText);
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Response data:", data);
    res.json(data);
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
