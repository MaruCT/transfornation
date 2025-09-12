import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion, Transition } from 'framer-motion';
import type { Project, Backer, ChatMessage, User, Pledge, Reward, MediaItem, Event, BlogPost, TeamMember, SocialLink } from './types';
import { View } from './types';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import CreateProjectForm from './components/CreateProjectForm';
import CommandPalette from './components/CommandPalette';
import LiveActivityFeed from './components/LiveActivityFeed';
import ProjectListSkeleton from './components/Skeletons';
import Globe from './components/Globe';
import Chatbot from './components/Chatbot';
import Profile from './components/Profile';
import ContestView from './components/ContestView';
import LandingPage from './components/LandingPage';
import EventDetail from './components/EventDetail';
import { generateInitialProjects, generateProjectImage, summarizeComments, generateFoundersPassImage, generateProjectScores } from './services/geminiService';
import { chatWithOpenAI } from './services/openaiService';
import { mockBlogPosts, mockEvents } from './services/mockData';
import Confetti from './components/Confetti';
import SuccessModal from './components/SuccessModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useProjectTranslation } from './hooks/useProjectTranslation';


const pageVariants = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  in: { opacity: 1, filter: 'blur(0px)' },
  out: { opacity: 0, filter: 'blur(4px)' },
};

const pageTransition: Transition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.6
};

const MOCK_USER: User = {
  id: 'user-123-alex',
  name: 'Alex',
  avatar: 'https://i.pravatar.cc/150?u=alex_j',
};

// Temporary helpers to seed random comments and avatars/names
const RANDOM_NAMES = ['Aruzhan', 'Damir', 'Amina', 'Maksat', 'Diana', 'Nursultan', 'Alina', 'Ilyas', 'Aigerim', 'Timur', 'Madina', 'Ruslan', 'Yernar', 'Anel', 'Bota', 'Ayan', 'Sultan', 'Dana', 'Elina'];
const RANDOM_COMMENTS = [
  'Nice project! Looking forward to updates.',
  'Great concept. Wishing you success!',
  'Impressive work from the team.',
  'Looks promising, keep it up!',
  'Clean idea and solid execution.',
  'Following this with interest.',
  'Well done! Excited to see more.',
  'Good luck with the launch!',
  'This could be big. Subscribed.',
  'Solid direction. Cheering for you!',
  'Neat! Can’t wait to try it.',
  'Great progress so far.',
];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randomAvatarUrl = (seed: string) => `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
const makeRandomComments = (count: number) => {
  // pick unique comments by shuffling
  const shuffledComments = [...RANDOM_COMMENTS].sort(() => Math.random() - 0.5);
  const shuffledNames = [...RANDOM_NAMES].sort(() => Math.random() - 0.5);
  const n = Math.min(count, shuffledComments.length);
  return Array.from({ length: n }).map((_, idx) => {
    const name = shuffledNames[idx % shuffledNames.length];
    const daysAgo = randomInt(0, 20);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      author: name,
      avatar: randomAvatarUrl(`${name}-${idx}-${Math.random().toString(36).slice(2)}`),
      text: shuffledComments[idx],
      date,
      type: 'user' as const,
    };
  });
};
const seedProjectsWithRandomComments = (projects: Project[]): Project[] => {
  return projects.map(p => ({
    ...p,
    comments: (p.comments && p.comments.length > 0) ? p.comments : makeRandomComments(randomInt(2, 6))
  }));
}

const seedProjectsWithRandomStats = (projects: Project[]): Project[] => {
  return projects.map(p => {
    const safeGoal = p.goal && p.goal > 0 ? p.goal : randomInt(5000, 50000);
    const pledged = (p.pledged && p.pledged > 0) ? p.pledged : randomInt(Math.floor(safeGoal * 0.05), Math.floor(safeGoal * 0.6));
    const backers = (p.backers && p.backers > 0) ? p.backers : randomInt(10, 800);
    const anticipationScore = p.anticipationScore && p.anticipationScore > 0 ? p.anticipationScore : randomInt(60, 90);
    const impactScore = p.impactScore && p.impactScore > 0 ? p.impactScore : randomInt(55, 88);
    const efficiencyScore = p.efficiencyScore && p.efficiencyScore > 0 ? p.efficiencyScore : randomInt(58, 92);
    return {
      ...p,
      goal: safeGoal,
      pledged,
      backers,
      anticipationScore,
      impactScore,
      efficiencyScore,
    };
  });
};

const getSystemPrompt = (projects: Project[]) => {
    const projectContext = projects.map(p => 
        `ID: ${p.id}\nProject: "${p.title}" (Category: ${p.category})\nTagline: ${p.tagline}\nGoal: $${p.goal}, Pledged: $${p.pledged}\n`
    ).join('\n---\n');

    return `You are Spark, a friendly and intelligent AI assistant for InnovateHub, a crowdfunding platform. Your goal is to help users discover interesting projects, assist creators with ideas, and provide insights into crowdfunding trends. You are conversational and encouraging.

    Here is the current list of projects on the platform. Use this information to provide specific and helpful answers. Do not make up projects.

    <PROJECT_CONTEXT>
    ${projectContext}
    </PROJECT_CONTEXT>

    When a user asks for recommendations, use the project context. To recommend a specific project, you MUST use the format [PROJECT:id] at the beginning of your response, replacing 'id' with the actual project ID. For example: "[PROJECT:123] I found a great tech project for you!". 
    Also, use markdown for formatting: **bold** for emphasis and *italics* for nuance. Do not use other markdown. Keep your responses concise.`;
};

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>(View.Landing);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPledges, setUserPledges] = useState<Pledge[]>([]);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [fundedProjectInfo, setFundedProjectInfo] = useState<{ title: string; amount: number; isFounder: boolean } | null>(null);
  const { t, language } = useLanguage();
  const { getTranslatedContent, translateProjectContent, isTranslating } = useProjectTranslation();
  const prevLanguageRef = useRef(language);
  const [translationUpdateKey, setTranslationUpdateKey] = useState(0); // Force re-render after translation


  const categories = useMemo(() => Array.from(new Set(projects.map(p => p.category))), [projects]);
  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter(p => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  // Get translated project content
  const getTranslatedProject = useCallback((project: Project): Project => {
    const translatedContent = getTranslatedContent(project, language);
    
    if (!translatedContent) {
      return project;
    }

    return {
      ...project,
      title: translatedContent.title,
      tagline: translatedContent.tagline,
      description: translatedContent.description,
      problems: translatedContent.problems,
      creatorBio: translatedContent.creatorBio,
      faq: translatedContent.faq,
      rewards: project.rewards.map((reward, index) => ({
        ...reward,
        title: translatedContent.rewards[index]?.title || reward.title,
        description: translatedContent.rewards[index]?.description || reward.description
      }))
    };
  }, [getTranslatedContent, language]);

  // Prepare project content for display
  const prepareProjectContent = useCallback(async (project: Project): Promise<Project> => {
    // If Russian, return original content immediately
    if (language === 'ru') {
      return project;
    }
    
    // Check if translation exists in cache
    const cachedTranslation = getTranslatedContent(project, language);
    if (cachedTranslation) {
      return getTranslatedProject(project);
    }
    
    // Start translation in background
    translateProjectContent(project, language).then((translation) => {
      if (translation) {
        const updatedProject = getTranslatedProject(project);
        setSelectedProject(updatedProject);
        setTranslationUpdateKey(prev => prev + 1);
      }
    });
    
    // Return original content immediately
    return project;
  }, [language, getTranslatedContent, translateProjectContent, getTranslatedProject]);

  // Auto-translate project when language changes
  useEffect(() => {
    if (selectedProject && language !== prevLanguageRef.current) {
      // Get translated version immediately
      const translatedProject = getTranslatedProject(selectedProject);
      setSelectedProject(translatedProject);
      setTranslationUpdateKey(prev => prev + 1);
      
      // If no cached translation exists and language is not Russian, start translation
      if (language !== 'ru' && !getTranslatedContent(selectedProject, language)) {
        translateProjectContent(selectedProject, language).then((translation) => {
          if (translation) {
            const updatedProject = getTranslatedProject(selectedProject);
            setSelectedProject(updatedProject);
            setTranslationUpdateKey(prev => prev + 1);
          }
        });
      }
    }
    prevLanguageRef.current = language;
  }, [language]); // Only depend on language to avoid infinite loops


  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialProjects = await generateInitialProjects();
      const withStats = seedProjectsWithRandomStats(initialProjects);
      const withComments = seedProjectsWithRandomComments(withStats);
      setProjects(withComments);
      setBlogPosts(mockBlogPosts);
      setEvents(mockEvents);
    } catch (e) {
      console.error(e);
      setError("Failed to load projects. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  useEffect(() => {
    if (chatMessages.length === 0) {
        setChatMessages([{
            id: 'init-spark',
            role: 'model',
            text: "Hello! I'm Spark, your AI assistant for InnovateHub. How can I help you discover, create, or learn about projects today?"
        }]);
    }
  }, []);

  // Открываем проект по URL (?p=ID) после загрузки проектов
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('s');
      const pid = params.get('p');
      if ((slug || pid) && projects.length > 0 && !selectedProject) {
        const proj = slug ? projects.find(p => p.slug === slug) : projects.find(p => p.id === pid!);
        if (proj) {
          setSelectedProject(proj);
          setView(View.ProjectDetail);
          
          // If language is not Russian and no cached translation exists, start translation
          if (language !== 'ru' && !getTranslatedContent(proj, language)) {
            translateProjectContent(proj, language).then((translation) => {
              if (translation) {
                const updatedProject = getTranslatedProject(proj);
                setSelectedProject(updatedProject);
                setTranslationUpdateKey(prev => prev + 1);
              }
            });
          }
        }
      }
    } catch {}
  }, [projects, language, getTranslatedContent, translateProjectContent, getTranslatedProject]);


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelectProject = (project: Project) => {
    // Обновляем URL для пермалинка ?p=ID или ?s=slug
    try {
      const url = new URL(window.location.href);
      if (project.slug) {
        url.searchParams.delete('p');
        url.searchParams.set('s', project.slug);
      } else {
        url.searchParams.delete('s');
        url.searchParams.set('p', project.id);
      }
      window.history.pushState({ p: project.id }, '', url.toString());
    } catch {}
    
    // Set the original project first
    setSelectedProject(project);
    setView(View.ProjectDetail);
    window.scrollTo(0,0);
    
    // If language is not Russian and no cached translation exists, start translation
    if (language !== 'ru' && !getTranslatedContent(project, language)) {
      translateProjectContent(project, language).then((translation) => {
        if (translation) {
          const updatedProject = getTranslatedProject(project);
          setSelectedProject(updatedProject);
          setTranslationUpdateKey(prev => prev + 1);
        }
      });
    }
  };
  
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setView(View.EventDetail);
    window.scrollTo(0,0);
  };

  const handleSetView = (newView: View) => {
    if (newView === View.Home || newView === View.Landing) {
        setSelectedProject(null);
        setSelectedEvent(null);
        // Чистим параметры из URL при выходе из карточки
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('p');
          url.searchParams.delete('s');
          window.history.pushState({}, '', url.pathname + (url.search ? '?' + url.searchParams.toString() : ''));
        } catch {}
    }
    if (newView === View.CreateProject && !currentUser) {
        alert("Please log in to create a project.");
        return;
    }
    if (newView === View.Profile && !currentUser) {
        alert("Please log in to see your profile.");
        return;
    }
    setView(newView);
  }
  
  const handleSelectCategoryAndNavigate = (category: string) => {
    setSelectedCategory(category);
    setView(View.Home);
    window.scrollTo(0,0);
  };

  const handleLogin = () => setCurrentUser(MOCK_USER);
  const handleLogout = () => setCurrentUser(null);
  
  const handleToggleFavorite = (projectId: string) => {
    if (!currentUser) return;
    const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
            const isFavorited = p.favoritedBy.includes(currentUser.id);
            return {
                ...p,
                favoritedBy: isFavorited
                    ? p.favoritedBy.filter(id => id !== currentUser.id)
                    : [...p.favoritedBy, currentUser.id]
            };
        }
        return p;
    });
    setProjects(updatedProjects);
    if(selectedProject && selectedProject.id === projectId) {
      setSelectedProject(updatedProjects.find(p => p.id === projectId) || null);
    }
  };

  const handleAddProject = async (newProjectData: Pick<Project, 'title' | 'creator' | 'creatorBio' | 'creatorAvatar' | 'tagline' | 'description' | 'category' | 'goal' | 'rewards' | 'faq' | 'roadmap' | 'comments' | 'city' | 'country' | 'media' | 'imageUrl' | 'team' | 'socialLinks'>) => {
    if (!currentUser) return;
    
    setView(View.Home);
    
    const scores = await generateProjectScores(newProjectData.title, newProjectData.description);
    
    const finalMedia = [...newProjectData.media];
    // Ensure cover image is first in media array if it's not already
    const hasCoverImageInMedia = finalMedia.some(item => item.url === newProjectData.imageUrl);
    if (!hasCoverImageInMedia && newProjectData.imageUrl) {
        finalMedia.unshift({ type: 'image', url: newProjectData.imageUrl });
    }


    const seededStats = seedProjectsWithRandomStats([{
      ...newProjectData,
      id: new Date().toISOString(),
      creatorId: currentUser.id,
      pledged: 0,
      backers: 0,
      media: finalMedia,
      videoGenerationState: finalMedia.some(m => m.type === 'video') ? 'done' : 'none',
      fundingVelocity: 'stable',
      comments: makeRandomComments(randomInt(2, 5)),
      commentSummary: { sentiment: 'N/A', summary: 'No comments yet.'},
      backersList: [],
      favoritedBy: [],
      ...scores,
      roadmap: [
        { milestone: 'Project Launched', description: 'The journey begins! The campaign is now live.', status: 'completed' },
        { milestone: 'Funding Goal', description: 'Reach the funding goal to bring this project to life.', status: 'in_progress' },
        { milestone: 'Production', description: 'Begin manufacturing and development.', status: 'planned' }
      ]
    }])[0];
    const newProject: Project = seededStats;
    setProjects(prevProjects => [newProject, ...prevProjects]);
    window.scrollTo(0,0);
  };
  
  const handleFundProject = (projectId: string, amount: number, reward: Reward) => {
      if (!currentUser) return;

      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      // Trigger success UI immediately
      setFundedProjectInfo({ title: project.title, amount: amount, isFounder: reward.isFoundersPass || false });
      
      // Prepare new data
      const newBackerName = `Backer #${project.backers + 1}`;
      const newPledge: Pledge = {
        projectId,
        projectTitle: project.title,
        projectImageUrl: project.imageUrl,
        amount,
        rewardTitle: reward.title,
      };
      const newBacker: Backer = {
          name: newBackerName,
          avatar: `https://i.pravatar.cc/150?u=${newBackerName.replace(/\s+/g, '_')}`,
          level: amount > 200 ? 'Gold' : amount > 50 ? 'Silver' : 'Bronze',
          badges: [],
          isFounder: reward.isFoundersPass || false,
          foundersPassImage: undefined, // Placeholder
      };

      // Update state optimistically
      setUserPledges(prev => [newPledge, ...prev]);

      const updatedProjects = projects.map(p => {
          if (p.id === projectId) {
              const updatedProject = {
                  ...p,
                  pledged: p.pledged + amount,
                  backers: p.backers + 1,
                  backersList: [newBacker, ...p.backersList]
              };
              if (selectedProject && selectedProject.id === projectId) {
                setSelectedProject(updatedProject);
              }
              return updatedProject;
          }
          return p;
      });
      setProjects(updatedProjects);
      
      // --- Handle async tasks in the background ---
      
      // Generate founder's pass if applicable
      if (reward.isFoundersPass) {
          generateFoundersPassImage(project.title, newBackerName)
              .then(foundersPassImage => {
                  setProjects(currentProjects => {
                      const projectsWithPass = currentProjects.map(p => {
                          if (p.id === projectId) {
                              const updatedBackers = p.backersList.map(b => 
                                  b.name === newBackerName ? { ...b, foundersPassImage } : b
                              );
                              const finalProjectUpdate = { ...p, backersList: updatedBackers };
                              if (selectedProject && selectedProject.id === projectId) {
                                  setSelectedProject(finalProjectUpdate);
                              }
                              return finalProjectUpdate;
                          }
                          return p;
                      });
                      return projectsWithPass;
                  });
              })
              .catch(err => console.error("Failed to generate founder's pass image in background:", err));
      }

      // Update comment summary
      const fundedProject = updatedProjects.find(p => p.id === projectId);
      if (fundedProject) {
          summarizeComments(fundedProject.comments)
              .then(summary => {
                  setProjects(currentProjects => {
                      const projectsWithSummary = currentProjects.map(p => {
                          if (p.id === projectId) {
                              const projectWithSummary = { ...p, commentSummary: summary };
                              if (selectedProject && selectedProject.id === projectId) {
                                  setSelectedProject(projectWithSummary);
                              }
                              return projectWithSummary;
                          }
                          return p;
                      });
                      return projectsWithSummary;
                  });
              })
              .catch(err => console.error("Failed to summarize comments in background:", err));
      }
  };

   const handleSendMessage = async (message: string) => {
        if (isChatLoading) return;
        
        setIsChatLoading(true);
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: message };
        const newMessages = [...chatMessages, userMessage];
        setChatMessages(newMessages);
        
        const aiMessagePlaceholderId = (Date.now() + 1).toString();
        const aiMessagePlaceholder: ChatMessage = { id: aiMessagePlaceholderId, role: 'model', text: '' };
        setChatMessages(prev => [...prev, aiMessagePlaceholder]);

        try {
            const systemPrompt = getSystemPrompt(projects);
            const history = newMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text }));
            const messagesToApi = [{ role: 'system', content: systemPrompt }, ...history] as any;

            const fullText = await chatWithOpenAI(messagesToApi);

            let projectFound: Project | undefined = undefined;
            const projectTagMatch = fullText.match(/\[PROJECT:([^\]]+)\]/);
            if (projectTagMatch) {
              const projectId = projectTagMatch[1];
              projectFound = projects.find(p => p.id === projectId);
            }

            const displayText = fullText.replace(/\[PROJECT:([^\]]+)\]\s*/, '');
            setChatMessages(prev => prev.map(msg => (
              msg.id === aiMessagePlaceholderId 
                ? { ...msg, text: displayText, project: projectFound || msg.project } 
                : msg
            )));
        } catch (error) {
            console.error("Error sending message to AI:", error);
            setChatMessages(prev => prev.map(msg => 
                msg.id === aiMessagePlaceholderId ? { ...msg, text: "Sorry, I encountered an error. Please try again." } : msg
            ));
        } finally {
            setIsChatLoading(false);
        }
    };


  const renderContent = () => {
    if (isLoading && (view === View.Home || view === View.Landing)) {
      return (
        <ProjectListSkeleton />
      );
    }

    if (error) {
      return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    switch (view) {
      case View.ProjectDetail:
        return selectedProject && <ProjectDetail 
                                    key={`${selectedProject.id}-${translationUpdateKey}`}
                                    project={selectedProject} 
                                    onBack={() => handleSetView(View.Home)} 
                                    onFund={handleFundProject} 
                                    currentUser={currentUser}
                                    isTranslating={isTranslating(selectedProject.id)}
                                    onToggleFavorite={handleToggleFavorite}
                                  />;
      case View.EventDetail:
        return selectedEvent && <EventDetail 
                                  event={selectedEvent}
                                  onBack={() => handleSetView(View.Landing)}
                                />;
      case View.CreateProject:
        return currentUser && <CreateProjectForm 
                                currentUser={currentUser} 
                                onAddProject={handleAddProject} 
                                onBack={() => handleSetView(View.Home)} 
                              />;
      case View.Profile:
        return currentUser && <Profile 
                                user={currentUser}
                                pledges={userPledges}
                                favoriteProjects={projects.filter(p => p.favoritedBy.includes(currentUser.id))}
                                createdProjects={projects.filter(p => p.creatorId === currentUser.id)}
                                onSelectProject={handleSelectProject}
                              />
      case View.Contest:
        return <ContestView projects={projects} onSelectProject={handleSelectProject} />
      case View.Home:
        return <ProjectList 
                    projects={filteredProjects} 
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    onSelectProject={handleSelectProject} 
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavorite}
                />;
      case View.Landing:
      default:
        return <LandingPage 
                    projects={projects}
                    categories={categories}
                    onSelectProject={handleSelectProject}
                    onSelectCategory={handleSelectCategoryAndNavigate}
                />;
    }
  };
  
  return (
    <div className="min-h-screen font-sans text-gray-200">
        <AnimatePresence>
            {fundedProjectInfo && <Confetti isFounder={fundedProjectInfo.isFounder} />}
        </AnimatePresence>
        <SuccessModal 
            isOpen={!!fundedProjectInfo}
            onClose={() => setFundedProjectInfo(null)}
            projectTitle={fundedProjectInfo?.title || ''}
            pledgeAmount={fundedProjectInfo?.amount || 0}
            isFounder={fundedProjectInfo?.isFounder || false}
        />
        <Globe />
        <CommandPalette 
            isOpen={isCommandPaletteOpen} 
            setIsOpen={setCommandPaletteOpen}
            projects={projects}
            onSelectProject={(project) => {
                handleSelectProject(project);
                setCommandPaletteOpen(false);
            }}
            onCreateProject={() => {
                handleSetView(View.CreateProject);
                setCommandPaletteOpen(false);
            }}
        />
        <LiveActivityFeed projects={projects} onSelectProject={handleSelectProject} />

        {chatMessages.length > 0 && (
            <Chatbot 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                onSelectProject={handleSelectProject}
            />
        )}
      
      <Header 
        setView={handleSetView} 
        currentUser={currentUser} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />
      <main>
        <AnimatePresence mode="wait">
            <motion.div
                key={view + (selectedProject?.id || '') + (selectedEvent?.id || '')}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                {renderContent()}
            </motion.div>
        </AnimatePresence>
      </main>
      <footer className="bg-transparent mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 border-t border-white/10">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);


export default App;