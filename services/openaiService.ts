export type ChatMessageOpenAI = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chatWithOpenAI(messages: ChatMessageOpenAI[], model: string = 'gpt-4o-mini') {
  const res = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'OpenAI chat failed');
  }
  const data = await res.json();
  // OpenAI response structure
  const content = data?.choices?.[0]?.message?.content ?? '';
  return content as string;
}


