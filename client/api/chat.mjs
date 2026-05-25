import { handleChat } from "./chat-handler.mjs";

export default function handler(req, res) {
  return handleChat(req, res);
}