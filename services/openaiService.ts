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

export interface ProjectTranslation {
  title: string;
  tagline: string;
  description: string;
  problems?: string;
  creatorBio: string;
  faq: { question: string; answer: string; }[];
  rewards: { title: string; description: string; }[];
}

export async function translateProject(project: any, targetLanguage: string): Promise<ProjectTranslation> {
  const languageNames = {
    'en': 'English',
    'ru': 'Russian', 
    'zh': 'Chinese'
  };

  const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || 'English';

  const systemPrompt = `You are a professional translator. Translate the following project information from Russian to ${targetLangName}. 
  
  IMPORTANT RULES:
  - Keep HTML tags intact (like <strong>, <p>, <ol>, <li>, etc.)
  - Maintain the same structure and formatting
  - For technical terms, use commonly accepted translations
  - Keep project names and proper nouns in original language if they are brand names
  - Return ONLY valid JSON in this exact format:
  {
    "title": "translated title",
    "tagline": "translated tagline", 
    "description": "translated description with HTML preserved",
    "problems": "translated problems with HTML preserved",
    "creatorBio": "translated creator bio",
    "faq": [{"question": "translated question", "answer": "translated answer"}],
    "rewards": [{"title": "translated title", "description": "translated description"}]
  }`;

  const userPrompt = `Translate this project to ${targetLangName}:

Title: ${project.title}
Tagline: ${project.tagline}
Description: ${project.description}
Problems: ${project.problems || ''}
Creator Bio: ${project.creatorBio}
FAQ: ${JSON.stringify(project.faq || [])}
Rewards: ${JSON.stringify(project.rewards || [])}`;

  try {
    const response = await chatWithOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // Try to parse the JSON response
    const translation = JSON.parse(response);
    return translation;
  } catch (error) {
    console.error('Translation failed:', error);
    // Fallback: return original content
    return {
      title: project.title,
      tagline: project.tagline,
      description: project.description,
      problems: project.problems,
      creatorBio: project.creatorBio,
      faq: project.faq || [],
      rewards: project.rewards || []
    };
  }
}


