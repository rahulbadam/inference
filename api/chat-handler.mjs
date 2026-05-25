export async function handleChat(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const data = JSON.parse(body);
    const { messages } = data;

    if (!messages || !Array.isArray(messages)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Messages array required" }));
      return;
    }

    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "HF_API_KEY environment variable not set" }));
      return;
    }

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V4-Pro:novita",
          messages,
          max_tokens: 1024,
          stream: false,
        }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error("HF API error:", response.status, responseData);
      res.statusCode = response.status;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error:
            responseData.error?.message ||
            responseData.error ||
            `HuggingFace API error: ${response.status}`,
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(responseData));
  } catch (error) {
    console.error("Chat handler error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message }));
  }
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}