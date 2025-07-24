// api/generate-comment.js

const OpenAI = require("openai").default || require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  // ボディを手動パース
  let raw = "";
  for await (const chunk of req) {
    raw += chunk.toString();
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error("[generate-comment] JSON parse error:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const decibel = Number(payload.decibel);
  if (!Number.isFinite(decibel)) {
    console.error("[generate-comment] Invalid decibel:", payload.decibel);
    return res.status(400).json({ error: "Missing or invalid decibel" });
  }

  // プロンプト作成
  const prompt = `現在の室内音量は約${decibel.toFixed(1)}dBです。快適度に合わせて一言コメントを日本語でお願いします。`;

  try {
    // ChatCompletion を呼び出し
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは快適度チェッカーのコメント生成アシスタントです。" },
        { role: "user", content: prompt }
      ],
      max_tokens: 60,
      temperature: 0.7
    });

    const comment = completion.choices?.[0]?.message?.content?.trim();
    if (!comment) {
      throw new Error("No comment in response");
    }

    return res.status(200).json({ comment });
  } catch (err) {
    console.error("[generate-comment] OpenAI error:", err);
    return res.status(500).json({ error: "Comment generation failed" });
  }
};
