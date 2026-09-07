import OpenAI from 'openai';

const key = process.env.DASHSCOPE_API_KEY;
console.log('API Key found:', key ? `${key.substring(0, 10)}...` : 'NOT FOUND');

try {
  const client = new OpenAI({
    apiKey: key,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
  const response = await client.chat.completions.create({
    model: 'qwen-plus',
    messages: [{ role: 'user', content: 'Say hello in one word' }],
  });
  console.log('✅ Qwen (DashScope) works! Response:', response.choices[0]?.message?.content);
} catch (err) {
  console.log('❌ Qwen (DashScope) failed:', err.message);
}
