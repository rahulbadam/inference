import http from "http";
import dotenv from "dotenv";
import { handleChat } from "./client/api/chat-handler.mjs";

// Load .env file from project root for local dev
dotenv.config();

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/chat") {
    return handleChat(req, res);
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}/api/chat`);
});