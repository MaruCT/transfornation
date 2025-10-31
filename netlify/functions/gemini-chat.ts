import type { Handler } from '@netlify/functions';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: 'Missing GEMINI_API_KEY' };

  try {
    const payload = JSON.parse(event.body || '{}') as {
      messages: { role: 'user' | 'model'; content: string }[];
      model?: string;
      temperature?: number;
      stream?: boolean;
    };
    const { messages, model = 'gemini-1.5-flash', temperature = 0.3, stream = false } = payload;

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: 'Invalid messages' };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));
    const lastMessage = history.pop();

    if (!lastMessage) {
      return { statusCode: 400, body: 'Invalid messages' };
    }

    const chat = geminiModel.startChat({
      history,
      generationConfig: {
        temperature,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    if (stream) {
      const streamResult = await chat.sendMessageStream(lastMessage.parts);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunkText })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*', 
        },
        body: readable,
      };
    } else {
      const result = await chat.sendMessage(lastMessage.parts);
      const response = result.response;
      const text = response.text();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', 
        },
        body: JSON.stringify({ content: text }),
      };
    }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Internal Error' };
  }
};
