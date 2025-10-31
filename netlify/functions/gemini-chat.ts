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
    console.log('Received event:', JSON.stringify(event, null, 2));
    const payload = JSON.parse(event.body || '{}') as {
      messages: { role: 'user' | 'model'; content: string }[];
      model?: string;
      temperature?: number;
      stream?: boolean;
    };
    console.log('Parsed payload:', payload);
    const { messages, model = 'gemini-pro', temperature = 0.3, stream = false } = payload;

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: 'Invalid messages' };
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return { statusCode: 400, body: 'Invalid last message' };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    if (stream) {
      const streamResult = await geminiModel.generateContentStream(lastMessage.content);

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
      const result = await geminiModel.generateContent(lastMessage.content);
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
    console.error('Error in gemini-chat function:', e);
    return { statusCode: 500, body: e?.message || 'Internal Error' };
  }
};
