import React, { useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import type { Project, Reward, Backer, User, MediaItem, SocialLink } from '../types';
import { UsersIcon, TargetIcon, BackArrowIcon, CheckIcon, DiamondIcon, SparklesIcon, VideoIcon, BotIcon, HeartIcon, LocationPinIcon, FlameIcon, BrainCircuitIcon, ZapIcon, TwitterIcon, FacebookIcon, InstagramIcon, LinkIcon, ShareIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onFund: (projectId: string, amount: number, reward: Reward) => void;
  currentUser: User | null;
  onToggleFavorite: (projectId: string) => void;
  isTranslating?: boolean;
}

const socialIcons: { [key in SocialLink['platform']]: React.ReactNode } = {
    twitter: <TwitterIcon className="h-5 w-5" />,
    facebook: <FacebookIcon className="h-5 w-5" />,
    instagram: <InstagramIcon className="h-5 w-5" />,
    website: <LinkIcon className="h-5 w-5" />,
};


const MetricDisplay: React.FC<{ icon: React.ReactNode; label: string; score: number; color: string; }> = ({ icon, label, score, color }) => (
    <div className="flex items-center">
        <div className={`h-8 w-8 rounded-md flex-shrink-0 flex items-center justify-center ${color}/20`}>
            {icon}
        </div>
        <div className="ml-3">
            <p className="text-sm font-semibold text-white">{label}</p>
            <div className="w-24 bg-black/30 rounded-full h-1 mt-1">
                <div className={`h-1 rounded-full ${color}`} style={{ width: `${score}%` }}></div>
            </div>
        </div>
        <p className="ml-auto text-sm font-bold text-white">{score}</p>
    </div>
);


const HolographicCard: React.FC<{ reward: Reward, onSelect: () => void, disabled: boolean }> = ({ reward, onSelect, disabled }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const { t } = useLanguage();

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30, bounce: 0.2 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30, bounce: 0.2 });
    
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12.5deg', '-12.5deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12.5deg', '12.5deg']);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || disabled) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };
    
    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            className={`w-full rounded-2xl p-5 relative bg-gradient-to-br from-yellow-400/10 to-orange-500/10 transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={!disabled ? onSelect : undefined}
        >
            <div className="absolute inset-0 rounded-2xl" style={{ border: '1px solid rgba(251, 191, 36, 0.3)', background: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1), transparent 70%)' }} />
            <div style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }} className="text-center">
                 <DiamondIcon className="h-10 w-10 mx-auto text-yellow-300" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.7))' }} />
                 <h4 className="mt-4 font-bold text-lg text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{reward.title}</h4>
                 <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 drop-shadow-lg">{formatCurrency(reward.pledgeAmount)}</p>
                 <p className="mt-2 text-sm text-yellow-200/80 drop-shadow-lg">{reward.description}</p>
                 <div className={`mt-4 w-full text-black font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ${disabled ? 'bg-gray-500' : 'bg-yellow-400/80 hover:bg-yellow-400'}`} style={{ boxShadow: disabled ? 'none' : '0 0 20px rgba(251, 191, 36, 0.4)'}}>
                    {t('projectDetail.becomeFounder')}
                 </div>
            </div>
        </motion.div>
    );
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onFund, currentUser, onToggleFavorite, isTranslating = false }) => {
  const { t } = useLanguage();
  const TABS = [
    t('projectDetail.tabs.story'), 
    t('projectDetail.tabs.teamAndSocials'),
    t('projectDetail.tabs.roadmap'), 
    t('projectDetail.tabs.faq'), 
    t('projectDetail.tabs.community'), 
  ];

  const [fundingAmount, setFundingAmount] = useState(25);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedBacker, setSelectedBacker] = useState<Backer | null>(null);
  
  const mediaForDisplay = useMemo(() => {
    const video = project.media.find(m => m.type === 'video');
    if (video) {
      return [video, ...project.media.filter(item => item.url !== video.url)];
    }
    return project.media;
  }, [project.media]);
  
  const [activeMedia, setActiveMedia] = useState<MediaItem>(mediaForDisplay[0] || { type: 'image', url: project.imageUrl });
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
  const [driveEmbedFallback, setDriveEmbedFallback] = useState<boolean>(false);

  React.useEffect(() => {
    // Reset loader and fallback when media changes
    setIsMediaLoading(true);
    setDriveEmbedFallback(false);
    const isDrivePreview = /drive\.google\.com\/.+\/preview/.test(activeMedia.url);
    if (activeMedia.type === 'video' && isDrivePreview) {
      const timer = setTimeout(() => {
        // If still loading after timeout, enable fallback
        setDriveEmbedFallback(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [activeMedia]);
  
  const progressPercentage = Math.min((project.pledged / project.goal) * 100, 100);
  const isFavorited = currentUser && project.favoritedBy.includes(currentUser.id);

  const handleSelectReward = (reward: Reward) => {
    if (!currentUser) {
        alert("Please log in to support this project.");
        return;
    }
    setSelectedReward(reward);
    setFundingAmount(reward.pledgeAmount);
    setIsModalOpen(true);
  }

  const handleFund = () => {
    if (fundingAmount > 0 && selectedReward) {
      onFund(project.id, fundingAmount, selectedReward);
      setIsModalOpen(false);
      setSelectedReward(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.button 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onBack} 
            className="flex items-center text-sm font-medium text-gray-400 hover:text-white mb-8 transition-colors"
        >
            <BackArrowIcon className="h-5 w-5 mr-2" />
            {t('projectDetail.backToProjects')}
        </motion.button>
        
        <div className="flex flex-col lg:flex-row lg:space-x-12">
            {/* Main Content */}
            <div className="lg:w-2/3">
                 <motion.div layoutId={`project-card-${project.id}`} className="mb-8">
                    <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3">
                            <motion.h1 layoutId={`project-title-${project.id}`} className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-glow">{project.title}</motion.h1>
                            {isTranslating && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-blue-300 font-medium">Translating...</span>
                                </div>
                            )}
                        </div>
                         {currentUser && (
                            <motion.button 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                onClick={() => onToggleFavorite(project.id)} 
                                className="mt-2 flex-shrink-0 h-12 w-12 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
                            >
                                <HeartIcon className={`h-6 w-6 transition-colors ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} />
                            </motion.button>
                         )}
                    </div>
                    <p className="mt-3 text-lg text-gray-400">{project.tagline}</p>
                 </motion.div>
                
                <div className="mb-8">
                    <motion.div layoutId={`project-image-${project.id}`} className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-black aspect-video flex items-center justify-center">
                        <AnimatePresence initial={false}>
                             <motion.div
                                key={activeMedia.url}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                {(!activeMedia.url || activeMedia.url.trim() === '') ? null : activeMedia.type === 'image' ? (
                                    <img 
                                        src={activeMedia.url} 
                                        alt={project.title} 
                                        className="w-full h-full object-cover" 
                                        onLoad={() => setIsMediaLoading(false)}
                                    />
                                ) : (() => {
                                    const isDrivePreview = /drive\.google\.com\/.+\/preview/.test(activeMedia.url);
                                    if (isDrivePreview) {
                                        const hasQuery = /\?/.test(activeMedia.url);
                                        const params = 'autoplay=1&mute=1&loop=1';
                                        const src = `${activeMedia.url}${hasQuery ? '&' : '?'}${params}`;
                                        // Extract Drive file id to build a download fallback URL
                                        const idMatch = activeMedia.url.match(/\/file\/d\/([^/]+)/) || activeMedia.url.match(/id=([^&#]+)/);
                                        const fileId = idMatch ? decodeURIComponent(idMatch[1]) : '';
                                        const downloadUrl = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : '';
                                        if (!driveEmbedFallback) {
                                          return (
                                            <iframe
                                              src={src}
                                              allow="autoplay; encrypted-media"
                                              className="w-full h-full"
                                              onLoad={() => setIsMediaLoading(false)}
                                            />
                                          );
                                        }
                                        // Fallback to HTML5 video using direct download URL
                                        return (
                                          <div className="w-full h-full">
                                            {downloadUrl ? (
                                              <video
                                                src={downloadUrl}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                preload="auto"
                                                className="w-full h-full object-cover"
                                                controlsList="nodownload noplaybackrate nofullscreen"
                                                disablePictureInPicture
                                                onLoadedData={() => setIsMediaLoading(false)}
                                                onError={() => setIsMediaLoading(false)}
                                              />
                                            ) : (
                                              <a href={activeMedia.url} target="_blank" rel="noreferrer" className="text-sm text-blue-300 underline">Open video</a>
                                            )}
                                          </div>
                                        );
                                    }
                                    return (
                                        <video
                                            src={activeMedia.url}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="auto"
                                            className="w-full h-full object-cover"
                                            controlsList="nodownload noplaybackrate nofullscreen"
                                            disablePictureInPicture
                                            onLoadedData={() => setIsMediaLoading(false)}
                                            onError={() => setIsMediaLoading(false)}
                                        />
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>

                        {(isMediaLoading || (project.videoGenerationState === 'generating' && isMediaLoading)) && (
                             <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4 z-10">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ ease: "linear", duration: 2, repeat: Infinity }}
                                >
                                    <SparklesIcon className="h-12 w-12 text-[#0057FF]" />
                                </motion.div>
                                <h3 className="mt-4 text-xl font-bold text-white">Loading media...</h3>
                                <p className="mt-1 text-gray-300">This might take a moment...</p>
                             </div>
                        )}
                    </motion.div>
                    
                     {project.media && project.media.length > 1 && (
                        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                            {mediaForDisplay.map(mediaItem => (
                                <button
                                    key={mediaItem.url}
                                    onClick={() => { setActiveMedia(mediaItem); setIsMediaLoading(true); }}
                                    className={`relative flex-shrink-0 w-28 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 focus:outline-none ${activeMedia.url === mediaItem.url ? 'border-[#0057FF]' : 'border-transparent hover:border-white/50'}`}
                                >
                                    <img
                                        src={mediaItem.type === 'image' ? mediaItem.url : project.imageUrl}
                                        alt="media thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                    {mediaItem.type === 'video' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <VideoIcon className="h-6 w-6 text-white" />
                                        </div>
                                    )}
                                    {activeMedia.url === mediaItem.url && <div className="absolute inset-0 ring-2 ring-[#0057FF] rounded-md" style={{boxShadow: '0 0 10px var(--accent-glow-color)'}}/>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                 <div className="rounded-2xl p-6 lg:p-8 border border-white/10" style={{background: 'rgba(0, 22, 65, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
                     <div className="border-b border-white/10">
                           <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                                {TABS.map(tab => (
                                    <button 
                                        key={tab} 
                                        onClick={() => setActiveTab(tab)}
                                        className={`${
                                            activeTab === tab 
                                            ? 'border-[#88B1FF] text-[#88B1FF]' 
                                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                           </nav>
                        </div>
                        <div className="mt-6 prose prose-slate dark:prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-headings:text-glow prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:marker:text-[#0057FF]">
                            {activeTab === t('projectDetail.tabs.story') && (
                              <div className="leading-relaxed space-y-8">
                                <div dangerouslySetInnerHTML={{ __html: project.description || '' }} />
                                {project.problems && (
                                  <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Какие проблемы решает проект</h3>
                                    <div className="text-gray-300" dangerouslySetInnerHTML={{ __html: project.problems }} />
                                  </div>
                                )}
                              </div>
                            )}
                            {activeTab === t('projectDetail.tabs.teamAndSocials') && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-white text-glow mb-4">{t('projectDetail.meetTheTeam')}</h3>
                                        {project.team && project.team.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {project.team.map((member, index) => (
                                                    <div key={index} className="flex items-center space-x-4">
                                                        <img src={member.avatar} alt={member.name} className="h-16 w-16 rounded-full border-2 border-white/20" />
                                                        <div>
                                                            <h4 className="font-bold text-white">{member.name}</h4>
                                                            <p className="text-sm text-gray-400">{member.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">{t('projectDetail.noTeamInfo')}</p>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white text-glow mb-4">{t('projectDetail.followUs')}</h3>
                                        {project.socialLinks && project.socialLinks.length > 0 ? (
                                             <div className="flex flex-wrap gap-4">
                                                {project.socialLinks.map((link, index) => (
                                                    <a href={link.url} key={index} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                                                        {socialIcons[link.platform]}
                                                        <span className="capitalize">{link.platform}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">{t('projectDetail.noSocials')}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeTab === t('projectDetail.tabs.roadmap') && (
                                <div className="relative pl-6 after:absolute after:inset-y-0 after:w-px after:bg-white/10 after:left-0">
                                    {project.roadmap.map((step, index) => (
                                        <div key={index} className="relative mb-8 pl-8">
                                            <div className="absolute -left-[23px] top-1 h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-[#001641]/40 bg-gray-700">
                                                {step.status === 'completed' && <CheckIcon className="h-3 w-3 text-[#0057FF]"/>}
                                                {step.status === 'in_progress' && <div className="h-2 w-2 bg-[#0057FF] rounded-full animate-pulse"></div>}
                                            </div>
                                            <h4 className={`font-semibold ${step.status === 'planned' ? 'text-gray-400' : 'text-white'}`}>{step.milestone}</h4>
                                            <p className={`mt-1 text-sm ${step.status === 'planned' ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === t('projectDetail.tabs.faq') && (
                                <div className="space-y-8">
                                    {(Array.isArray(project.faq) ? project.faq : []).map((item, index) => (
                                        <div key={index}>
                                            <h4 className="font-semibold text-white">{item.question}</h4>
                                            <p className="mt-2 text-gray-300">{item.answer}</p>
                                        </div>
                                    ))}
                                    {(!project.faq || !Array.isArray(project.faq) || project.faq.length === 0) && (
                                        <p className="text-gray-400">{t('projectDetail.noSocials')}</p>
                                    )}
                                </div>
                            )}
                            {activeTab === t('projectDetail.tabs.community') && (
                                <div className="space-y-6">
                                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-gradient-to-r from-[#0057FF]/10 to-[#004AD8]/10 border border-[#0057FF]/20">
                                       <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-gray-800 border border-white/10">
                                         <BotIcon className="h-5 w-5 text-[#0057FF]" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#88B1FF]">{t('projectDetail.aiSummary')}</p>
                                            <p className="text-xs text-gray-500"><span className="font-semibold">{t('projectDetail.sentiment')}:</span> {project.commentSummary.sentiment}</p>
                                            <p className="mt-1 text-gray-300">{project.commentSummary.summary}</p>
                                        </div>
                                    </div>
                                    <hr className="border-white/10" />
                                    {project.comments.filter(c => c.type === 'user').length > 0 ? project.comments.filter(c => c.type === 'user').map((comment, index) => (
                                        <div key={index} className="flex items-start space-x-4 border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                                            <img src={comment.avatar} alt={comment.author} className="h-10 w-10 rounded-full border-2 border-white/10" />
                                            <div>
                                                <p className="font-bold text-sm text-white">{comment.author}</p>
                                                <p className="text-xs text-gray-500">{comment.date}</p>
                                                <p className="mt-1 text-gray-300">{comment.text}</p>
                                            </div>
                                        </div>
                                    )) : <p className="text-gray-400">{t('projectDetail.noComments')}</p>}
                                    
                                     <div className="pt-6">
                                        <h3 className="text-xl font-bold text-white text-glow mb-4">{t('projectDetail.foundersWall')}</h3>
                                        {project.backersList && project.backersList.length > 0 ? (
                                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                                {project.backersList.map((backer, index) => (
                                                    <motion.div 
                                                        key={index}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.02 }}
                                                    >
                                                        <img 
                                                            src={backer.avatar} 
                                                            alt={`Backer ${index + 1}`} 
                                                            className="h-10 w-10 rounded-full border-2 border-white/20 hover:border-[#0057FF] transition-colors cursor-pointer"
                                                            onClick={() => setSelectedBacker(backer)}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">{t('projectDetail.beFirstBacker')}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                 </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:w-1/3 mt-12 lg:mt-0">
                 <div className="sticky top-28 space-y-8">
                      <div className="rounded-2xl p-6 border border-white/10" style={{background: 'rgba(0, 22, 65, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
                        <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#0057FF] to-[#004AD8] h-2 rounded-full" style={{ width: `${progressPercentage}%`, boxShadow: `0 0 10px var(--accent-glow-color)` }}></div>
                        </div>
                        <div className="mt-4">
                            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#88B1FF] to-[#AACCFF] text-glow-accent">{formatCurrency(project.pledged)}</p>
                            <p className="text-sm text-gray-400">{t('projectDetail.pledgedOf', { goal: formatCurrency(project.goal) })}</p>
                        </div>
                        <div className="mt-4 flex justify-between text-sm text-gray-300">
                            <div className="flex items-center">
                                <UsersIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                                <p><span className="font-bold text-white">{project.backers.toLocaleString()}</span> {t('projectDetail.backers')}</p>
                            </div>
                            <div className="flex items-center">
                                <TargetIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                                <p><span className="font-bold text-white">{Math.round(progressPercentage)}%</span> {t('projectDetail.funded')}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10 flex items-center">
                            <img src={project.creatorAvatar} alt={project.creator} className="h-12 w-12 rounded-full object-cover border-2 border-white/20" />
                            <div className="ml-4">
                                <p className="font-bold text-white">{project.creator}</p>
                                <div className="flex items-center text-xs text-gray-400">
                                    <LocationPinIcon className="h-3 w-3 mr-1" />
                                    <span>{project.city}, {project.country}</span>
                                </div>
                            </div>
                        </div>
                         <div className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-4">{t('projectDetail.aiMetrics')}</h4>
                             <div className="space-y-4">
                                <MetricDisplay icon={<FlameIcon className="h-5 w-5 text-orange-400" />} label={t('projectDetail.anticipation')} score={project.anticipationScore} color="bg-orange-500" />
                                <MetricDisplay icon={<BrainCircuitIcon className="h-5 w-5 text-fuchsia-400" />} label={t('projectDetail.impact')} score={project.impactScore} color="bg-fuchsia-500" />
                                <MetricDisplay icon={<ZapIcon className="h-5 w-5 text-green-400" />} label={t('projectDetail.efficiency')} score={project.efficiencyScore} color="bg-green-500" />
                             </div>
                         </div>
                         <div className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-4">{t('projectDetail.shareProject')}</h4>
                            <div className="flex space-x-2">
                                <a href={`https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project%3A%20${encodeURIComponent(project.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                                    <TwitterIcon className="h-5 w-5" />
                                </a>
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                                    <FacebookIcon className="h-5 w-5" />
                                </a>
                                <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                                    <LinkIcon className="h-5 w-5" />
                                </button>
                            </div>
                         </div>
                    </div>
                     <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white text-glow">{t('projectDetail.supportProject')}</h3>
                        {!currentUser && <p className="text-sm text-yellow-300 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">{t('projectDetail.pleaseLogin')}</p>}
                        {project.rewards.map((reward, index) => (
                           reward.isFoundersPass ? (
                                <HolographicCard key={index} reward={reward} onSelect={() => handleSelectReward(reward)} disabled={!currentUser} />
                           ) : (
                            <div key={index} onClick={() => handleSelectReward(reward)} className={`rounded-lg p-5 border border-white/10 transition-all duration-300 ${currentUser ? 'cursor-pointer hover:border-[#0057FF]/50' : 'opacity-50 cursor-not-allowed'}`} style={{background: 'rgba(0, 22, 65, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
                                <p className="text-xl font-bold text-[#88B1FF] text-glow-accent">{formatCurrency(reward.pledgeAmount)}</p>
                                <h4 className="mt-2 font-bold text-white">{reward.title}</h4>
                                <p className="mt-2 text-sm text-gray-300 flex-grow">{reward.description}</p>
                                <button disabled={!currentUser} className="mt-4 w-full bg-white/10 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {t('projectDetail.selectReward')}
                                </button>
                            </div>
                           )
                        ))}
                    </div>
                 </div>
            </div>
        </div>
        
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white text-glow">{t('projectDetail.backProject')}</h3>
              {selectedReward && <p className="mt-2 text-gray-400">{t('projectDetail.youSelected', { rewardTitle: selectedReward.title })}</p>}
              <div className="mt-6">
                <label htmlFor="fundingAmount" className="sr-only">Amount</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-gray-400 text-lg">$</span>
                  </div>
                  <input
                    type="number"
                    name="fundingAmount"
                    id="fundingAmount"
                    className="block w-full text-lg rounded-md border-white/20 bg-[#001641]/50 text-white pl-8 pr-12 py-3 focus:border-[#0057FF] focus:ring-[#0057FF]"
                    placeholder="25"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(Number(e.target.value))}
                    min="1"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-gray-400" id="price-currency">USD</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 rounded-md hover:bg-white/10"
                >
                  {t('projectDetail.cancel')}
                </button>
                <button
                  onClick={handleFund}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8] rounded-md shadow-lg shadow-[#0057FF]/30 hover:opacity-90"
                >
                  {t('projectDetail.pledge', { amount: formatCurrency(fundingAmount) })}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedBacker && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedBacker(null)}>
                <motion.div initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}} className="bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                      <img src={selectedBacker.avatar} alt={selectedBacker.name} className="h-20 w-20 rounded-full border-4 border-[#0057FF]/50 shadow-lg" />
                      <h3 className="mt-4 text-xl font-bold text-white text-glow">{selectedBacker.name}</h3>
                      <p className="text-sm font-semibold text-yellow-400">{t('projectDetail.backerLevel', { level: selectedBacker.level })}</p>
                      <div className="mt-2 flex gap-2">
                          {selectedBacker.badges.map(badge => <span key={badge} className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{badge}</span>)}
                          {selectedBacker.isFounder && <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full flex items-center"><DiamondIcon className="h-3 w-3 mr-1" />{t('projectDetail.founder')}</span>}
                      </div>
                      {selectedBacker.isFounder && selectedBacker.foundersPassImage && (
                          <div className="mt-4 w-full">
                              <h4 className="text-sm font-bold tracking-widest uppercase text-gray-400">{t('projectDetail.foundersPass')}</h4>
                              <img src={selectedBacker.foundersPassImage} alt="Founder's Pass Art" className="mt-2 rounded-lg w-full aspect-[3/4] object-cover border-2 border-yellow-400/30" />
                          </div>
                      )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetail;