import type { Handler } from '@netlify/functions';

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: 'Missing OPENAI_API_KEY' };

  try {
    const payload = JSON.parse(event.body || '{}') as {
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      model?: string;
      temperature?: number;
    };
    const { messages, model = 'gpt-4o-mini', temperature = 0.3 } = payload;

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: 'Invalid messages' };
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: false,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: text || 'OpenAI request failed',
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
      body: text,
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Internal Error' };
  }
};



