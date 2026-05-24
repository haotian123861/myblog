import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {
  const { messages, stream = false } = req.body;

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://api.deepseek.com";
  const model = process.env.AI_MODEL || "deepseek-chat";

  if (!apiKey) {
    return res.status(400).json({ success: false, error: "AI_API_KEY 未配置，请在 server/.env 中设置" });
  }

  const body = JSON.stringify({ model, messages, stream });

  if (stream) {
    try {
      const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({ success: false, error: `AI API error: ${errText}` });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") {
            res.write("data: [DONE]\n\n");
            continue;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }
      res.end();
    } catch (err) {
      res.status(502).json({ success: false, error: `AI API 请求失败: ${err.message}` });
    }
  } else {
    try {
      const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({ success: false, error: `AI API error: ${errText}` });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      res.json({ success: true, data: { text } });
    } catch (err) {
      res.status(502).json({ success: false, error: `AI API 请求失败: ${err.message}` });
    }
  }
});

export default router;
