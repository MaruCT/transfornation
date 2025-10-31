import type { Project, Reward, Comment, AnalysisResult, Backer, MediaItem, TeamMember, SocialLink, ChatMessage } from '../types';
import { loadProjectsFromCSV } from './csvImport';

// NOTE: The functions below (generateProjectImage, generateFoundersPassImage, etc.) are still using mock data.
// The chat functionality, however, is now connected to the Gemini API.

const MOCK_PROJECT_VIDEO = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const generateProjectImage = async (title: string): Promise<string> => {
    try {
        // Временно возвращаем мок-изображение, так как Gemini API отключен
        console.log("Generating mock project image for:", title);
        return `https://picsum.photos/seed/${title.replace(/\s+/g, '')}/600/400`;
    } catch (error) {
        console.error("Error generating project image:", error);
        return `https://picsum.photos/seed/${title.replace(/\s+/g, '')}/600/400`;
    }
};

export const generateFoundersPassImage = async (title: string, backerName: string): Promise<string> => {
    try {
        // Временно возвращаем мок-изображение, так как Gemini API отключен
        console.log("Generating mock founder's pass image for:", title, backerName);
        return `https://picsum.photos/seed/${title.replace(/\s+/g, '')}${backerName}/300/400`;
    } catch (error) {
        console.error("Error generating founder's pass image:", error);
        return `https://picsum.photos/seed/${title.replace(/\s+/g, '')}${backerName}/300/400`;
    }
};

export const generateVideoTrailer = async (title: string, tagline: string): Promise<string> => {
    try {
        // Временно возвращаем мок-видео, так как Gemini API отключен
        console.log("Generating mock video trailer for:", title);
        return MOCK_PROJECT_VIDEO;
    } catch(error) {
        console.error("Error generating video trailer:", error);
        return MOCK_PROJECT_VIDEO;
    }
};

export const summarizeComments = async (comments: Comment[]): Promise<{ sentiment: string, summary: string }> => {
    const fallback = { sentiment: 'Mixed', summary: 'Could not analyze comments at this time.' };
    if (comments.length < 2) {
        return { sentiment: 'N/A', summary: 'Not enough comments to analyze.'};
    }
    
    try {
        // Временно возвращаем мок-анализ, так как Gemini API отключен
        console.log("Generating mock comment summary for", comments.length, "comments");
        return {
            sentiment: 'Positive',
            summary: 'Comments show strong support for this impact project. Backers are excited about the potential positive change in Central Asia.'
        };
    } catch (error) {
        console.error("Error summarizing comments:", error);
        return fallback;
    }
};

export const generateInitialProjects = async (): Promise<Project[]> => {
    // Попытка загрузить проекты из CSV. При ошибке — откат к мок-данным ниже.
    try {
        console.log('Attempting to load projects from CSV...');
        const csvProjects = await loadProjectsFromCSV();
        console.log('CSV projects loaded:', csvProjects.length);
        if (csvProjects.length > 0) {
            console.log('Using CSV projects');
            return csvProjects;
        }
    } catch (e) {
        console.warn('CSV projects load failed or empty. Falling back to mocks.', e);
    }

    const mockProjects: Project[] = []; // Remove mock projects

    return Promise.resolve(mockProjects);
};


export const generateProjectScores = async (title: string, description: string): Promise<{ anticipationScore: number; impactScore: number; efficiencyScore: number; }> => {
    try {
        // Временно возвращаем мок-оценки, так как Gemini API отключен
        console.log("Generating mock project scores for:", title);
        return { 
            anticipationScore: 75, 
            impactScore: 80, 
            efficiencyScore: 70 
        };
    } catch (error) {
        console.error("Error generating project scores:", error);
        return { anticipationScore: 60, impactScore: 60, efficiencyScore: 60 };
    }
};

export const generateProjectDetailsFromIdea = async (idea: string, creatorName: string): Promise<{title: string, tagline: string, description: string, creatorBio: string}> => {
    console.log("🤖 generateProjectDetailsFromIdea ENTRY POINT - NO GEMINI API CALLS!");
    console.warn("🚫 GEMINI API IS COMPLETELY DISABLED - USING MOCK DATA ONLY!");
    
    try {
        // Временно возвращаем мок-данные, так как Gemini API отключен
        console.log("🤖 generateProjectDetailsFromIdea called with:", { idea, creatorName });
        console.warn("🔧 DEBUG: Generating mock project details...");
        
        // Убеждаемся, что не вызываем никаких API
        console.log("🔒 NO API CALLS - PURE MOCK DATA GENERATION");
        
        const result = {
            title: idea.length > 50 ? idea.substring(0, 50) + "..." : idea,
            tagline: "Revolutionary impact project for Central Asia",
            description: `<h2>About This Project</h2><p>${idea}</p><h3>Our Mission</h3><p>Creating positive impact in Central Asia through innovative solutions.</p>`,
            creatorBio: `${creatorName} is passionate about creating meaningful change in Central Asia.`
        };
        
        console.log("📤 generateProjectDetailsFromIdea returning:", result);
        console.warn("✅ MOCK DATA GENERATED SUCCESSFULLY - NO GEMINI API USED!");
        return result;
    } catch (error) {
        console.error("❌ Error in generateProjectDetailsFromIdea:", error);
        console.error("❌ This should never happen as we don't call any APIs!");
        return {
            title: "Error Generating Title",
            tagline: "Please write a tagline manually.",
            description: `Error generating description for "${idea}". Please write one manually.`,
            creatorBio: `Error generating bio for "${creatorName}". Please write one manually.`
        };
    }
};

export const suggestRewards = async (projectTitle: string, projectDescription: string, fundingGoal: number): Promise<Reward[]> => {
    try {
        // Временно возвращаем мок-награды, так как Gemini API отключен
        console.log("Generating mock rewards for:", projectTitle);
        return [
            {
                title: "Supporter",
                pledgeAmount: Math.floor(fundingGoal * 0.1),
                description: "Thank you for supporting our impact project!",
                isFoundersPass: false
            },
            {
                title: "Backer",
                pledgeAmount: Math.floor(fundingGoal * 0.25),
                description: "Get exclusive updates and early access to project results.",
                isFoundersPass: false
            },
            {
                title: "Founder's Pass",
                pledgeAmount: Math.floor(fundingGoal * 0.5),
                description: "Premium supporter with exclusive benefits and recognition.",
                isFoundersPass: true
            }
        ];
    } catch (error) {
        console.error("Error suggesting rewards:", error);
        throw new Error("Could not suggest rewards.");
    }
};

export const generateFaqs = async (projectTitle: string, projectDescription: string): Promise<{question: string, answer: string}[]> => {
    try {
        // Временно возвращаем мок-FAQ, так как Gemini API отключен
        console.log("Generating mock FAQs for:", projectTitle);
        return [
            {
                question: "What is the timeline for this project?",
                answer: "We expect to complete this project within 6-12 months, depending on funding and development progress."
            },
            {
                question: "How will my contribution be used?",
                answer: "Your contribution will directly support the development and implementation of this impact project in Central Asia."
            },
            {
                question: "What happens if the project doesn't reach its goal?",
                answer: "If we don't reach our funding goal, we'll continue with a scaled-down version of the project using available funds."
            },
            {
                question: "How can I stay updated on progress?",
                answer: "We'll provide regular updates through our platform and email notifications to all backers."
            }
        ];
    } catch (error) {
        console.error("Error generating FAQs:", error);
        throw new Error("Could not generate FAQs.");
    }
};

export const analyzeCampaignReadiness = async (projectData: any): Promise<AnalysisResult> => {
    try {
        // Временно возвращаем мок-анализ, так как Gemini API отключен
        console.log("Generating mock campaign analysis for:", projectData.title);
        return {
            score: 75,
            suggestions: [
                "Add more detailed project timeline and milestones",
                "Include testimonials or endorsements from experts",
                "Create a compelling video trailer to showcase your project",
                "Consider adding stretch goals to engage more backers"
            ]
        };
    } catch (error) {
        console.error("Error analyzing campaign readiness:", error);
        throw new Error("Failed to analyze campaign readiness.");
    }
};

export async function* streamChatResponse(messages: ChatMessage[]): AsyncGenerator<string> {
    const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, stream: true }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Gemini chat stream failed');
    }

    if (!res.body) {
        throw new Error('Response body is empty');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    const content = json.content;
                    if (content) {
                        yield content;
                    }
                } catch (error) {
                    console.error('Error parsing stream data:', error);
                }
            }
        }
    }
}
