// NOTE: This service has been refactored from OpenAI to use the Google Gemini API.
import { GoogleGenAI, Type } from "@google/genai";
import type { Project, Reward, Comment, AnalysisResult, Backer, MediaItem, TeamMember, SocialLink } from '../types';
import { loadProjectsFromCSV } from './csvImport';

// Lazy init Gemini only if API key is available. Avoid constructing in browser without key.
function getGemini() {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any)?.env?.API_KEY;
    if (!key) return null;
    try {
        return new GoogleGenAI({ apiKey: key });
    } catch {
        return null;
    }
}

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

    const mockProjects: Project[] = [
        {
            id: 'mock-proj-1',
            creatorId: 'mock-creator-1',
            title: "Aura Smart Ring: The Future of Wearable Tech",
            creator: "Transfornation Labs",
            creatorBio: "A team of engineers and designers passionate about creating technology that enhances human potential.",
            creatorAvatar: `https://i.pravatar.cc/150?u=transfornation_labs`,
            tagline: "Monitor your health, sleep, and activity with a sleek, minimalist smart ring.",
            description: `<h2>Meet Aura</h2><p>Aura is more than just a piece of jewelry. It's a powerful wellness tracker that seamlessly integrates into your life. We've packed state-of-the-art sensors into a tiny, comfortable, and stylish ring that you'll never want to take off.</p><h3>Key Features:</h3><ul><li>Advanced Sleep Tracking</li><li>Heart Rate & HRV Monitoring</li><li>Activity & Calorie Tracking</li><li>Water-resistant design</li></ul>`,
            category: 'Technology',
            imageUrl: `https://picsum.photos/seed/aura_ring_main/600/400`,
            media: [
                { type: 'image', url: `https://picsum.photos/seed/aura_ring_main/1200/800` },
                { type: 'video', url: MOCK_PROJECT_VIDEO },
                { type: 'image', url: `https://picsum.photos/seed/aura_lifestyle/1200/800` },
                { type: 'image', url: `https://picsum.photos/seed/aura_closeup/1200/800` },
            ],
            team: [
                { name: 'Dr. Evelyn Reed', role: 'CEO & Lead Engineer', avatar: 'https://i.pravatar.cc/150?u=evelyn_reed' },
                { name: 'Ben Carter', role: 'Product Designer', avatar: 'https://i.pravatar.cc/150?u=ben_carter' },
            ],
            socialLinks: [
                { platform: 'twitter', url: 'https://twitter.com/transfornation' },
                { platform: 'website', url: 'https://transfornation.dev' },
            ],
            videoGenerationState: 'done',
            goal: 50000,
            pledged: 37500,
            backers: 312,
            fundingVelocity: 'trending_up',
            faq: [
                { question: "How long does the battery last?", answer: "Aura's battery lasts for up to 7 days on a single charge." },
                { question: "Is it compatible with my phone?", answer: "Yes, Aura connects via Bluetooth to both iOS and Android devices." }
            ],
            rewards: [
                { title: "Early Bird Aura Ring", pledgeAmount: 149, description: "Get one Aura Smart Ring at a special early bird price.", isFoundersPass: false },
                { title: "Founder's Edition Aura Ring", pledgeAmount: 249, description: "A limited edition, engraved Aura Ring, plus exclusive access to our beta app.", isFoundersPass: true },
            ],
            comments: [
                { author: 'TechGuru', avatar: `https://i.pravatar.cc/150?u=tech_guru`, text: "This looks amazing! Can't wait to get mine.", date: '2 days ago', type: 'user' },
                { author: 'WellnessFan', avatar: `https://i.pravatar.cc/150?u=wellness_fan`, text: "Finally, a wearable that doesn't look like a bulky watch.", date: '1 day ago', type: 'user' },
            ],
            commentSummary: { sentiment: 'Overwhelmingly Positive', summary: 'Backers are excited about the sleek design and powerful features.' },
            roadmap: [
                { milestone: 'Campaign End', description: 'Finalize funding and begin production planning.', status: 'in_progress' },
                { milestone: 'Production Run', description: 'Start the first manufacturing run of the Aura rings.', status: 'planned' },
                { milestone: 'Shipping', description: 'Deliver the first batch of Aura rings to our amazing backers.', status: 'planned' },
            ],
            backersList: Array.from({ length: 15 }).map((_, i) => ({ name: `Backer ${i+1}`, avatar: `https://i.pravatar.cc/150?u=aura_backer_${i}`, level: 'Silver', badges: [], isFounder: i < 3, foundersPassImage: i < 3 ? `https://picsum.photos/seed/aura_pass_${i}/300/400` : undefined })),
            favoritedBy: [],
            city: "San Francisco",
            country: "US",
            anticipationScore: 92,
            impactScore: 85,
            efficiencyScore: 78,
        },
        {
            id: 'mock-proj-2',
            creatorId: 'mock-creator-2',
            title: "Luminance: Interactive Light Sculptures",
            creator: "Sophia Chen",
            creatorBio: "An artist and engineer exploring the intersection of light, art, and technology.",
            creatorAvatar: `https://i.pravatar.cc/150?u=sophia_chen`,
            tagline: "Bringing art to life with responsive, generative light installations for public spaces.",
            description: `<h2>The Art of Light</h2><p>Luminance is a series of modular light sculptures that react to their environment and to human interaction. Using custom software and sensors, each piece creates a unique, ever-changing display of light and color.</p><h3>Our Goal:</h3><p>We want to install these sculptures in parks, galleries, and city centers to bring a sense of wonder and connection to public spaces.</p>`,
            category: 'Art',
            imageUrl: `https://picsum.photos/seed/luminance_art/600/400`,
            media: [
                { type: 'image', url: `https://picsum.photos/seed/luminance_art/1200/800` },
                { type: 'image', url: `https://picsum.photos/seed/luminance_gallery/1200/800` },
            ],
            team: [
                { name: 'Sophia Chen', role: 'Lead Artist & Engineer', avatar: 'https://i.pravatar.cc/150?u=sophia_chen' },
            ],
            socialLinks: [
                { platform: 'instagram', url: 'https://instagram.com/luminance.art' },
            ],
            videoGenerationState: 'none',
            goal: 25000,
            pledged: 26100,
            backers: 158,
            fundingVelocity: 'stable',
            faq: [
                { question: "What are the sculptures made of?", answer: "They are constructed from durable, weatherproof materials with integrated LED systems." },
            ],
            rewards: [
                { title: "Digital Art Pack", pledgeAmount: 25, description: "A collection of high-resolution digital wallpapers inspired by Luminance.", isFoundersPass: false },
                { title: "Founder's Maquette", pledgeAmount: 500, description: "A signed, limited-edition miniature version of a Luminance sculpture for your home.", isFoundersPass: true },
            ],
            comments: [
                { author: 'ArtLover', avatar: `https://i.pravatar.cc/150?u=art_lover`, text: "Such a beautiful concept! I hope to see one in my city.", date: '5 days ago', type: 'user' },
            ],
            commentSummary: { sentiment: 'Positive', summary: 'The community loves the artistic vision and potential for public art.' },
            roadmap: [
                { milestone: 'Prototyping', description: 'Finalize the design and engineering of the modular units.', status: 'completed' },
                { milestone: 'First Installation', description: 'Install the first public Luminance sculpture.', status: 'planned' },
                { milestone: 'Community Workshops', description: 'Host workshops to teach people about interactive art.', status: 'planned' },
            ],
            backersList: Array.from({ length: 12 }).map((_, i) => ({ name: `Backer ${i+1}`, avatar: `https://i.pravatar.cc/150?u=luminance_backer_${i}`, level: 'Bronze', badges: [], isFounder: i < 2, foundersPassImage: i < 2 ? `https://picsum.photos/seed/luminance_pass_${i}/300/400` : undefined })),
            favoritedBy: [],
            city: "Berlin",
            country: "DE",
            anticipationScore: 88,
            impactScore: 95,
            efficiencyScore: 82,
        },
        {
            id: 'mock-proj-3',
            creatorId: 'mock-creator-3',
            title: "Chronoscape: A Cooperative Board Game",
            creator: "Tabletop Titans",
            creatorBio: "A group of friends who love designing and playing immersive board games.",
            creatorAvatar: `https://i.pravatar.cc/150?u=tabletop_titans`,
            tagline: "Travel through time, solve paradoxes, and rewrite history in this epic cooperative adventure.",
            description: `<h2>The Game</h2><p>Chronoscape is a cooperative game for 1-4 players. You'll take on the roles of temporal agents, working together to fix rips in the timeline. Each game is a unique puzzle with branching narratives and high replayability.</p>`,
            category: 'Games',
            imageUrl: `https://picsum.photos/seed/chronoscape_game/600/400`,
            media: [
                { type: 'image', url: `https://picsum.photos/seed/chronoscape_game/1200/800` },
                { type: 'image', url: `https://picsum.photos/seed/chronoscape_box/1200/800` },
                { type: 'image', url: `https://picsum.photos/seed/chronoscape_pieces/1200/800` },
            ],
            team: [
                { name: 'Kenji Tanaka', role: 'Game Designer', avatar: 'https://i.pravatar.cc/150?u=kenji_tanaka' },
                { name: 'Aisha Khan', role: 'Art Director', avatar: 'https://i.pravatar.cc/150?u=aisha_khan' },
                { name: 'Leo Martinez', role: 'Lead Playtester', avatar: 'https://i.pravatar.cc/150?u=leo_martinez' },
            ],
            socialLinks: [
                { platform: 'facebook', url: 'https://facebook.com/tabletop_titans' },
            ],
            videoGenerationState: 'none',
            goal: 40000,
            pledged: 62000,
            backers: 840,
            fundingVelocity: 'trending_up',
            faq: [
                { question: "How long is a typical game?", answer: "A single game of Chronoscape usually takes between 60 to 90 minutes." },
            ],
            rewards: [
                { title: "Core Game", pledgeAmount: 49, description: "One copy of the Chronoscape board game.", isFoundersPass: false },
                { title: "Deluxe Founder's Edition", pledgeAmount: 89, description: "The core game plus upgraded components, a Kickstarter-exclusive expansion, and your name in the rulebook.", isFoundersPass: true },
            ],
            comments: [
                { author: 'BoardGamer', avatar: `https://i.pravatar.cc/150?u=board_gamer`, text: "The time travel mechanic sounds really innovative!", date: '1 day ago', type: 'user' },
            ],
            commentSummary: { sentiment: 'Very Positive', summary: 'Gamers are excited about the unique theme and cooperative gameplay.' },
            roadmap: [
                { milestone: 'Art & Design', description: 'Finalize all artwork and graphic design for the game components.', status: 'in_progress' },
                { milestone: 'Manufacturing', description: 'Partner with a manufacturer to produce the game.', status: 'planned' },
                { milestone: 'Fulfillment', description: 'Ship the games to all our backers worldwide.', status: 'planned' },
            ],
            backersList: Array.from({ length: 20 }).map((_, i) => ({ name: `Backer ${i+1}`, avatar: `https://i.pravatar.cc/150?u=chrono_backer_${i}`, level: 'Gold', badges: ['First 100'], isFounder: i < 5, foundersPassImage: i < 5 ? `https://picsum.photos/seed/chrono_pass_${i}/300/400` : undefined })),
            favoritedBy: [],
            city: "London",
            country: "GB",
            anticipationScore: 95,
            impactScore: 75,
            efficiencyScore: 88,
        },
        {
            id: 'mock-proj-4',
            creatorId: 'mock-creator-4',
            title: "Nomad Desk: The Ultimate Portable Workspace",
            creator: "Ergo Designs",
            creatorBio: "We create beautiful, functional, and ergonomic products for the modern professional.",
            creatorAvatar: `https://i.pravatar.cc/150?u=ergo_designs`,
            tagline: "A beautifully crafted, lightweight, and ergonomic desk that sets up in seconds.",
            description: `<h2>Work Anywhere</h2><p>The Nomad Desk is designed for freelancers, students, and anyone who needs a comfortable workspace on the go. Made from sustainable bamboo, it's both durable and incredibly light. It folds flat to fit in a backpack and can be adjusted to multiple heights.</p>`,
            category: 'Design',
            imageUrl: `https://picsum.photos/seed/nomad_desk/600/400`,
            media: [
                { type: 'image', url: `https://picsum.photos/seed/nomad_desk/1200/800` },
            ],
            team: [],
            socialLinks: [],
            videoGenerationState: 'none',
            goal: 15000,
            pledged: 11200,
            backers: 120,
            fundingVelocity: 'slowing',
            faq: [
                { question: "How much does it weigh?", answer: "The Nomad Desk weighs just 2.5 lbs (1.1 kg)." },
            ],
            rewards: [
                { title: "The Nomad Desk", pledgeAmount: 89, description: "One Nomad Desk in your choice of natural or dark bamboo finish.", isFoundersPass: false },
                { title: "Founder's Work Bundle", pledgeAmount: 129, description: "One Nomad Desk plus a full accessory kit (laptop sleeve, mousepad, and cable organizer).", isFoundersPass: true },
            ],
            comments: [],
            commentSummary: { sentiment: 'N/A', summary: 'Not enough comments to analyze.' },
            roadmap: [
                { milestone: 'Tooling', description: 'Finalize the molds and tooling for manufacturing.', status: 'in_progress' },
                { milestone: 'First Production Batch', description: 'Manufacture and quality check the first batch of desks.', status: 'planned' },
                { milestone: 'Global Shipping', description: 'Begin shipping the Nomad Desk to backers.', status: 'planned' },
            ],
            backersList: Array.from({ length: 10 }).map((_, i) => ({ name: `Backer ${i+1}`, avatar: `https://i.pravatar.cc/150?u=nomad_backer_${i}`, level: 'Bronze', badges: [], isFounder: i < 1, foundersPassImage: i < 1 ? `https://picsum.photos/seed/nomad_pass_${i}/300/400` : undefined })),
            favoritedBy: [],
            city: "Copenhagen",
            country: "DK",
            anticipationScore: 75,
            impactScore: 80,
            efficiencyScore: 90,
        },
        {
            id: 'mock-proj-5',
            creatorId: 'mock-creator-5',
            title: "Botanic Brews: AI-Powered Vertical Herb Garden",
            creator: "Green Thumb Inc.",
            creatorBio: "We're making it easy for anyone to grow their own food, no matter where they live.",
            creatorAvatar: `https://i.pravatar.cc/150?u=green_thumb`,
            tagline: "Grow fresh, organic herbs at home year-round with our automated, app-controlled garden.",
            description: `<h2>Your Personal Garden</h2><p>Botanic Brews is a compact, vertical garden that uses hydroponics and an AI-powered system to create the perfect growing conditions for a variety of herbs. Our app tells you exactly when to harvest for peak flavor.</p>`,
            category: 'Food',
            imageUrl: `https://picsum.photos/seed/botanic_garden/600/400`,
            media: [
                { type: 'image', url: `https://picsum.photos/seed/botanic_garden/1200/800` },
            ],
            team: [],
            socialLinks: [],
            videoGenerationState: 'none',
            goal: 75000,
            pledged: 81500,
            backers: 450,
            fundingVelocity: 'stable',
            faq: [
                { question: "How many plants can it grow?", answer: "The standard unit can grow up to 12 different plants at once." },
            ],
            rewards: [
                { title: "Botanic Brews Garden", pledgeAmount: 199, description: "Get your own automated vertical herb garden and a starter seed kit.", isFoundersPass: false },
                { title: "Founder's 'Master Gardener' Kit", pledgeAmount: 349, description: "The garden, a year's supply of seed pods, and exclusive access to our premium app features.", isFoundersPass: true },
            ],
            comments: [
                { author: 'HomeCook', avatar: `https://i.pravatar.cc/150?u=home_cook`, text: "Fresh herbs in my apartment? Yes please!", date: '10 days ago', type: 'user' },
            ],
            commentSummary: { sentiment: 'Positive', summary: 'People are excited about the possibility of growing fresh food at home.' },
            roadmap: [
                { milestone: 'App Development', description: 'Finalize the iOS and Android companion apps.', status: 'in_progress' },
                { milestone: 'Sourcing Materials', description: 'Secure all components for the garden units.', status: 'in_progress' },
                { milestone: 'Assembly & Shipping', description: 'Assemble and ship the first units to backers.', status: 'planned' },
            ],
            backersList: Array.from({ length: 18 }).map((_, i) => ({ name: `Backer ${i+1}`, avatar: `https://i.pravatar.cc/150?u=botanic_backer_${i}`, level: 'Silver', badges: [], isFounder: i < 4, foundersPassImage: i < 4 ? `https://picsum.photos/seed/botanic_pass_${i}/300/400` : undefined })),
            favoritedBy: [],
            city: "Tokyo",
            country: "JP",
            anticipationScore: 90,
            impactScore: 88,
            efficiencyScore: 85,
        },
    ];

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
    try {
        // Временно возвращаем мок-данные, так как Gemini API отключен
        console.log("generateProjectDetailsFromIdea called with:", { idea, creatorName });
        const result = {
            title: idea.length > 50 ? idea.substring(0, 50) + "..." : idea,
            tagline: "Revolutionary impact project for Central Asia",
            description: `<h2>About This Project</h2><p>${idea}</p><h3>Our Mission</h3><p>Creating positive impact in Central Asia through innovative solutions.</p>`,
            creatorBio: `${creatorName} is passionate about creating meaningful change in Central Asia.`
        };
        console.log("generateProjectDetailsFromIdea returning:", result);
        return result;
    } catch (error) {
        console.error("Error generating project details:", error);
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

export const streamChatResponse = async (messages: { role: string; content: string }[]) => {
    // Эта функция больше не используется, так как мы переключились на OpenAI
    throw new Error('streamChatResponse is deprecated. Use OpenAI service instead.');
};