// api/generate-comment.js
const { Configuration, OpenAIApi } = require('openai');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const client = new OpenAIApi(config);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // クライアント側から decibel, timestamp を受け取る
  const { decibel, timestamp } = req.body || {};
  if (decibel == null) {
    return res.status(400).json({ error: 'Missing decibel' });
  }

  try {
    // プロンプトを作成
    const prompt = `現在の室内音量は約${decibel.toFixed(1)}dBです。快適度レベルに合わせて、一言のコメントを日本語でお願いします。`;

    // OpenAI ChatCompletion 呼び出し
    const completion = await client.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'あなたは快適度チェッカーのコメント生成アシスタントです。' },
        { role: 'user',   content: prompt }
      ],
      max_tokens: 20,
      temperature: 0.7
    });

    const comment = completion.data.choices[0].message.content.trim();
    return res.status(200).json({ comment });
  } catch (err) {
    console.error('[generate-comment] error', err);
    return res.status(500).json({ error: 'Comment generation failed' });
  }
};
