import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const getSystemPrompt = (projects: Project[]) => {
    const projectContext = projects.map(p => 
        `ID: ${p.id}\nProject: "${p.title}" (Category: ${p.category})\nTagline: ${p.tagline}\nGoal: $${p.goal}, Pledged: $${p.pledged}\n`
    ).join('\n---\n');

    return `You are Spark, a friendly and intelligent AI assistant for Transfornation, a platform for supporting Impact projects in Central Asia. Your goal is to help users discover interesting projects, assist creators with ideas, and provide insights into impact project trends. You are conversational and encouraging.

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
  const { t } = useLanguage();

  // URL routing
  useEffect(() => {
    const handleURLChange = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      if (path === '/') {
        setView(View.Landing);
        setSelectedProject(null);
      } else if (path.startsWith('/project/')) {
        const projectId = path.split('/project/')[1];
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setSelectedProject(project);
          setView(View.ProjectDetail);
        } else {
          // Project not found, redirect to home
          window.history.replaceState({}, '', '/');
          setView(View.Landing);
        }
      } else if (path === '/projects') {
        setView(View.Home);
        setSelectedProject(null);
      } else if (path === '/create') {
        setView(View.CreateProject);
        setSelectedProject(null);
      } else if (path === '/profile') {
        setView(View.Profile);
        setSelectedProject(null);
      } else if (path === '/contest') {
        setView(View.Contest);
        setSelectedProject(null);
      }
    };

    // Handle initial load
    handleURLChange();
    
    // Handle browser back/forward
    window.addEventListener('popstate', handleURLChange);
    
    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, [projects]);

  const categories = useMemo(() => Array.from(new Set(projects.map(p => p.category))), [projects]);
  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter(p => p.category === selectedCategory);
  }, [projects, selectedCategory]);


  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialProjects = await generateInitialProjects();
      setProjects(initialProjects);
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
            text: "Hello! I'm Spark, your AI assistant for Transfornation. How can I help you discover, create, or learn about impact projects today?"
        }]);
    }
  }, []);


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
    setSelectedProject(project);
    setView(View.ProjectDetail);
    // Update URL
    window.history.pushState({}, '', `/project/${project.id}`);
    window.scrollTo(0,0);
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
    }
    if (newView === View.CreateProject && !currentUser) {
        alert("Please log in to create a project.");
        return;
    }
    if (newView === View.Profile && !currentUser) {
        alert("Please log in to see your profile.");
        return;
    }
    
    // Update URL based on view
    switch (newView) {
      case View.Landing:
        window.history.pushState({}, '', '/');
        break;
      case View.Home:
        window.history.pushState({}, '', '/projects');
        break;
      case View.CreateProject:
        window.history.pushState({}, '', '/create');
        break;
      case View.Profile:
        window.history.pushState({}, '', '/profile');
        break;
      case View.Contest:
        window.history.pushState({}, '', '/contest');
        break;
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


    const newProject: Project = {
      ...newProjectData,
      id: new Date().toISOString(),
      creatorId: currentUser.id,
      pledged: 0,
      backers: 0,
      media: finalMedia,
      videoGenerationState: finalMedia.some(m => m.type === 'video') ? 'done' : 'none',
      fundingVelocity: 'stable',
      commentSummary: { sentiment: 'N/A', summary: 'No comments yet.'},
      backersList: [],
      favoritedBy: [],
      ...scores,
      roadmap: [
        { milestone: 'Project Launched', description: 'The journey begins! The campaign is now live.', status: 'completed' },
        { milestone: 'Funding Goal', description: 'Reach the funding goal to bring this project to life.', status: 'in_progress' },
        { milestone: 'Production', description: 'Begin manufacturing and development.', status: 'planned' }
      ]
    };
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
            // OpenAI expects 'user', 'assistant', and 'system' roles.
            // Our internal state uses 'user' and 'model'. We map 'model' to 'assistant' for the service.
            const history = newMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text }));
            const messagesToApi = [{ role: 'system', content: systemPrompt }, ...history];
            
            const responseText = await chatWithOpenAI(messagesToApi as any);

            let projectFound: Project | undefined = undefined;
            
            // Check for project reference in response
            const projectTagMatch = responseText.match(/\[PROJECT:([^\]]+)\]/);
            if (projectTagMatch) {
                const projectId = projectTagMatch[1];
                projectFound = projects.find(p => p.id === projectId);
            }

            const displayText = responseText.replace(/\[PROJECT:([^\]]+)\]\s*/, '');

            setChatMessages(prev => prev.map(msg => {
                if (msg.id === aiMessagePlaceholderId) {
                    const updatedMsg: ChatMessage = { ...msg, text: displayText };
                    if (projectFound) {
                        updatedMsg.project = projectFound;
                    }
                    return updatedMsg;
                }
                return msg;
            }));
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
                                    project={selectedProject} 
                                    onBack={() => handleSetView(View.Home)} 
                                    onFund={handleFundProject} 
                                    currentUser={currentUser}
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