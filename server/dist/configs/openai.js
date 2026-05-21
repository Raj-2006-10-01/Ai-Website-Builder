import * as OpenAI from 'openai';
const openai = new OpenAI.OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.AI_API_KEY,
});
export default openai;
