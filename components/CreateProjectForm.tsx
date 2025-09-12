import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project, Reward, AnalysisResult, User, MediaItem, TeamMember, SocialLink } from '../types';
import { generateProjectDetailsFromIdea, analyzeCampaignReadiness, suggestRewards, generateFaqs, generateProjectImage, generateVideoTrailer } from '../services/geminiService';
import { SparklesIcon, CheckIcon, UploadIcon, LightbulbIcon, GiftIcon, BrainCircuitIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateProjectFormProps {
  onAddProject: (projectData: Pick<Project, 'title' | 'creator' | 'creatorBio' | 'creatorAvatar' | 'tagline' | 'description' | 'category' | 'goal' | 'rewards' | 'faq' | 'roadmap' | 'comments' | 'city' | 'country' | 'media' | 'imageUrl' | 'team' | 'socialLinks'>) => void;
  onBack: () => void;
  currentUser: User;
}

const countries = [
  { name: 'Armenia', code: 'AM' },
  { name: 'Azerbaijan', code: 'AZ' },
  { name: 'Belarus', code: 'BY' },
  { name: 'Kazakhstan', code: 'KZ' },
  { name: 'Kyrgyzstan', code: 'KG' },
  { name: 'Moldova', code: 'MD' },
  { name: 'Russia', code: 'RU' },
  { name: 'Tajikistan', code: 'TJ' },
  { name: 'Turkmenistan', code: 'TM' },
  { name: 'Ukraine', code: 'UA' },
  { name: 'Uzbekistan', code: 'UZ' },
  { name: '---', code: '', disabled: true },
  { name: 'Denmark', code: 'DK' },
  { name: 'Germany', code: 'DE' },
  { name: 'Japan', code: 'JP' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'United States', code: 'US' },
];

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onAddProject, onBack, currentUser }) => {
  const { t } = useLanguage();

  const STEPS = [
    { id: 1, name: t('createProject.steps.idea'), icon: LightbulbIcon },
    { id: 2, name: t('createProject.steps.details'), icon: CheckIcon },
    { id: 3, name: t('createProject.steps.aiExtras'), icon: SparklesIcon },
    { id: 4, name: t('createProject.steps.rewards'), icon: GiftIcon },
    { id: 5, name: t('createProject.steps.analysis'), icon: BrainCircuitIcon },
    { id: 6, name: t('createProject.steps.launch'), icon: SparklesIcon },
  ];

  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState('');
  const [formData, setFormData] = useState({
      title: '',
      creator: currentUser.name,
      creatorBio: '',
      creatorAvatar: currentUser.avatar,
      tagline: '',
      description: '',
      category: 'Technology',
      goal: 10000,
      city: '',
      country: '',
      imageUrl: 'https://picsum.photos/seed/placeholder/600/400',
      rewards: [{ title: 'Pledge $10', pledgeAmount: 10, description: 'A heartfelt thank you from the team!' }] as Reward[],
      faq: [] as {question: string, answer: string}[],
      roadmap: [],
      comments: [],
      media: [] as MediaItem[],
      team: [] as TeamMember[],
      socialLinks: [] as SocialLink[],
      analysis: undefined as AnalysisResult | undefined,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [isMediaGenerating, setIsMediaGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  useEffect(() => {
    // Keep form data in sync if user changes
    setFormData(prev => ({ ...prev, creator: currentUser.name, creatorAvatar: currentUser.avatar }));
  }, [currentUser]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: id === 'goal' ? Number(value) : value}));
  };
  
  const handleRewardChange = (index: number, field: keyof Reward, value: string | number) => {
    const newRewards = [...formData.rewards];
    (newRewards[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, rewards: newRewards }));
  };
  
  const addReward = () => {
    setFormData(prev => ({ ...prev, rewards: [...prev.rewards, { title: '', pledgeAmount: 25, description: '' }]}));
  }
  
  const removeReward = (index: number) => {
    setFormData(prev => ({...prev, rewards: prev.rewards.filter((_, i) => i !== index)}));
  }

  const handleMediaChange = (index: number, field: keyof MediaItem, value: string) => {
    const newMedia = [...formData.media];
    (newMedia[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, media: newMedia }));
  };

  const addMediaItem = () => {
    setFormData(prev => ({ ...prev, media: [...prev.media, { type: 'image', url: '' }]}));
  };

  const removeMediaItem = (index: number) => {
    setFormData(prev => ({...prev, media: prev.media.filter((_, i) => i !== index)}));
  };

  const handleTeamChange = (index: number, field: keyof TeamMember, value: string) => {
    const newTeam = [...formData.team];
    (newTeam[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, team: newTeam }));
  };
  const addTeamMember = () => {
    setFormData(prev => ({ ...prev, team: [...prev.team, { name: '', role: '', avatar: '' }]}));
  };
  const removeTeamMember = (index: number) => {
    setFormData(prev => ({...prev, team: prev.team.filter((_, i) => i !== index)}));
  };
  
  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    const newSocialLinks = [...formData.socialLinks];
    (newSocialLinks[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, socialLinks: newSocialLinks }));
  };
  const addSocialLink = () => {
    setFormData(prev => ({ ...prev, socialLinks: [...prev.socialLinks, { platform: 'website', url: '' }]}));
  };
  const removeSocialLink = (index: number) => {
    setFormData(prev => ({...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== index)}));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProject(formData);
  };
  
  const handleGenerateDetails = async () => {
      if (!idea || !formData.creator) {
          alert("Please enter your name and project idea first.");
          return;
      }
      setIsGenerating(true);
      try {
          const { title, tagline, description, creatorBio } = await generateProjectDetailsFromIdea(idea, formData.creator);
          setFormData(prev => ({ ...prev, title, tagline, description, creatorBio }));
          nextStep();
      } catch (error) {
          console.error("Failed to generate details:", error);
          alert("Sorry, we couldn't generate details at this time.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGenerateMedia = async () => {
    if (!formData.title || !formData.tagline) {
        alert("Please ensure your project has a title and tagline before generating media.");
        return;
    }
    setIsMediaGenerating(true);
    try {
        setGenerationStatus('Generating cover image...');
        const imageUrl = await generateProjectImage(formData.title);
        // Put the new image at the start of the media array
        setFormData(prev => ({
            ...prev,
            imageUrl: imageUrl,
            media: [{ type: 'image', url: imageUrl }, ...prev.media.filter(m => m.type !== 'image' || m.url !== prev.imageUrl)]
        }));

        setGenerationStatus('Generating video trailer... (this may take a few minutes)');
        const videoUrl = await generateVideoTrailer(formData.title, formData.tagline);
        // Add the video to the media array
        setFormData(prev => ({
            ...prev,
            media: [...prev.media, { type: 'video', url: videoUrl }]
        }));
        
        setGenerationStatus('Media generated successfully!');

    } catch (error) {
        console.error("Failed to generate media:", error);
        setGenerationStatus('Generation failed. Please try again.');
    } finally {
        setIsMediaGenerating(false);
        setTimeout(() => setGenerationStatus(''), 4000); // Clear status message after 4s
    }
  };
  
  const handleSuggestRewards = async () => {
    setIsAiWorking(true);
    try {
      const suggested = await suggestRewards(formData.title, formData.description, formData.goal);
      setFormData(prev => ({ ...prev, rewards: suggested }));
    } catch(e) {
      alert("Failed to suggest rewards.");
    } finally {
      setIsAiWorking(false);
    }
  }
  
  const handleGenerateFaqs = async () => {
     setIsAiWorking(true);
    try {
      const faqs = await generateFaqs(formData.title, formData.description);
      setFormData(prev => ({ ...prev, faq: faqs }));
    } catch(e) {
      alert("Failed to generate FAQs.");
    } finally {
      setIsAiWorking(false);
    }
  }


  const handleAnalyzeCampaign = async () => {
    setIsAnalyzing(true);
    try {
        const analysisResult = await analyzeCampaignReadiness(formData);
        setFormData(prev => ({ ...prev, analysis: analysisResult }));
    } catch (error) {
        console.error("Failed to analyze campaign:", error);
        alert("Sorry, we couldn't analyze your campaign at this time.");
    } finally {
        setIsAnalyzing(false);
    }
  }
  
  const nextStep = () => setStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white tracking-tight text-center text-glow">{t('createProject.title')}</h1>
            <p className="mt-2 text-gray-400 text-center">{t('createProject.subtitle')}</p>
        
            <nav aria-label="Progress" className="my-12">
              <ol role="list" className="flex items-center justify-center">
                {STEPS.map((s, index) => (
                  <li key={s.name} className={`relative ${index !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                     {index !== STEPS.length - 1 ? (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className={`h-0.5 w-full ${s.id < step ? 'bg-gradient-to-r from-[#0057FF] to-[#004AD8]' : 'bg-gray-700'}`} />
                        </div>
                     ) : null}
                     <div className="relative">
                        <button onClick={() => setStep(s.id)} className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${s.id < step ? 'bg-gradient-to-br from-[#0057FF] to-[#004AD8] shadow-lg shadow-[#0057FF]/30' : s.id === step ? 'ring-4 ring-[#0057FF]/50 bg-gray-800' : 'bg-gray-800 border border-white/10 hover:border-white/30'}`}>
                            <s.icon className={`h-5 w-5 ${s.id <= step ? 'text-white' : 'text-gray-500'}`} aria-hidden="true" />
                        </button>
                        <p className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-300 whitespace-nowrap">{s.name}</p>
                     </div>
                  </li>
                ))}
              </ol>
            </nav>

            <form onSubmit={handleSubmit} className="mt-20 space-y-8 p-8 rounded-2xl border border-white/10" style={{background: 'rgba(0, 22, 65, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                {step === 1 && (
                     <div className="space-y-6">
                        <div>
                            <label htmlFor="creator" className="block text-sm font-medium text-gray-300">{t('createProject.yourName')}</label>
                            <input type="text" id="creator" value={formData.creator} readOnly className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-gray-400 focus:border-[#0057FF] focus:ring-[#0057FF] cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="idea" className="block text-sm font-medium text-gray-300">{t('createProject.yourIdea')}</label>
                            <textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" placeholder="e.g., A smart coffee mug that keeps drinks at the perfect temperature and tracks my caffeine intake." required></textarea>
                        </div>
                         <button type="button" onClick={handleGenerateDetails} disabled={isGenerating} className="mt-4 w-full relative inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8] hover:from-[#0057FF] hover:to-[#004AD8] shadow-lg shadow-[#0057FF]/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                                <SparklesIcon className={`mr-2 h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? t('createProject.generating') : t('createProject.generateDetails')}
                        </button>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-6">
                         <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">{t('createProject.projectTitle')}</label>
                            <input type="text" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" required/>
                        </div>
                         <div>
                            <label htmlFor="tagline" className="block text-sm font-medium text-gray-300">{t('createProject.tagline')}</label>
                            <input type="text" id="tagline" value={formData.tagline} onChange={handleChange} className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" required/>
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">{t('createProject.description')}</label>
                            <textarea id="description" value={formData.description} onChange={handleChange} rows={10} className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" required></textarea>
                         </div>

                         <div className="pt-6 mt-6 border-t border-white/10">
                            <h3 className="text-lg font-medium text-gray-300">{t('createProject.aiMediaGeneration')}</h3>
                            <p className="mt-1 text-sm text-gray-400">
                                {t('createProject.aiMediaDescription')}
                            </p>
                            <div className="mt-4">
                                <button type="button" onClick={handleGenerateMedia} disabled={isMediaGenerating} className="w-full relative inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8] hover:from-[#0057FF] hover:to-[#004AD8] shadow-lg shadow-[#0057FF]/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SparklesIcon className={`mr-2 h-5 w-5 ${isMediaGenerating ? 'animate-spin' : ''}`} />
                                    {isMediaGenerating ? generationStatus : (generationStatus || t('createProject.generateMedia'))}
                                </button>
                            </div>
                            {(formData.imageUrl !== 'https://picsum.photos/seed/placeholder/600/400' || formData.media.some(m => m.type === 'video')) && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.imageUrl && formData.imageUrl !== 'https://picsum.photos/seed/placeholder/600/400' && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-300 mb-2">{t('createProject.coverImagePreview')}</p>
                                            <img src={formData.imageUrl} alt="Generated cover" className="rounded-lg w-full aspect-video object-cover border border-white/10" />
                                        </div>
                                    )}
                                    {formData.media.find(m => m.type === 'video')?.url && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-300 mb-2">{t('createProject.videoTrailerPreview')}</p>
                                            <video src={formData.media.find(m => m.type === 'video')?.url} controls className="rounded-lg w-full aspect-video border border-white/10" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                         <div className="pt-6 mt-6 border-t border-white/10">
                            <label htmlFor="media" className="block text-sm font-medium text-gray-300">{t('createProject.additionalMedia')}</label>
                            <p className="mt-1 text-sm text-gray-400">{t('createProject.addMediaUrls')}</p>
                            <div className="mt-4 space-y-3">
                                {formData.media.filter(m => m.url !== formData.imageUrl).map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 rounded-md border border-white/20 bg-[#001641]/50">
                                        <select
                                            value={item.type}
                                            onChange={(e) => handleMediaChange(index, 'type', e.target.value)}
                                            className="rounded-md border-white/20 bg-gray-800 text-white text-sm focus:border-[#0057FF] focus:ring-[#0057FF]"
                                        >
                                            <option value="image">Image</option>
                                            <option value="video">Video</option>
                                        </select>
                                        <input
                                            type="url"
                                            value={item.url}
                                            onChange={(e) => handleMediaChange(index, 'url', e.target.value)}
                                            className="block w-full text-sm rounded-md border-white/20 bg-gray-800 text-white focus:border-[#0057FF] focus:ring-[#0057FF]"
                                            placeholder="https://example.com/image.png"
                                        />
                                        <button type="button" onClick={() => removeMediaItem(index)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-800 rounded-full h-7 w-7 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addMediaItem}
                                className="mt-3 w-full py-2 text-sm font-medium text-[#88B1FF] bg-[#0057FF]/10 rounded-md hover:bg-[#0057FF]/20"
                            >
                                {t('createProject.addMediaItem')}
                            </button>
                        </div>
                        
                         <div className="pt-6 mt-6 border-t border-white/10">
                            <h3 className="text-lg font-medium text-gray-300">{t('createProject.teamAndSocials')}</h3>
                            
                            <div className="mt-4 space-y-3">
                                <label className="block text-sm font-medium text-gray-300">{t('createProject.teamMembers')}</label>
                                {formData.team.map((member, index) => (
                                    <div key={index} className="flex items-start gap-2 p-2 rounded-md border border-white/20 bg-[#001641]/50">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow">
                                          <input type="text" value={member.name} onChange={(e) => handleTeamChange(index, 'name', e.target.value)} placeholder={t('createProject.teamMemberName')} className="block w-full text-sm rounded-md border-white/20 bg-gray-800 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" />
                                          <input type="text" value={member.role} onChange={(e) => handleTeamChange(index, 'role', e.target.value)} placeholder={t('createProject.teamMemberRole')} className="block w-full text-sm rounded-md border-white/20 bg-gray-800 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" />
                                          <input type="url" value={member.avatar} onChange={(e) => handleTeamChange(index, 'avatar', e.target.value)} placeholder={t('createProject.teamMemberAvatar')} className="block w-full text-sm rounded-md border-white/20 bg-gray-800 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" />
                                        </div>
                                        <button type="button" onClick={() => removeTeamMember(index)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-800 rounded-full h-7 w-7 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addTeamMember} className="w-full py-2 text-sm font-medium text-[#88B1FF] bg-[#0057FF]/10 rounded-md hover:bg-[#0057FF]/20">
                                    {t('createProject.addTeamMember')}
                                </button>
                            </div>
                             <div className="mt-4 space-y-3">
                                <label className="block text-sm font-medium text-gray-300">{t('createProject.socialLinks')}</label>
                                {formData.socialLinks.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 rounded-md border border-white/20 bg-[#001641]/50">
                                        <select value={link.platform} onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)} className="rounded-md border-white/20 bg-gray-800 text-white text-sm focus:border-[#0057FF] focus:ring-[#0057FF]">
                                            <option value="website">Website</option>
                                            <option value="twitter">Twitter</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="facebook">Facebook</option>
                                        </select>
                                        <input type="url" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} className="block w-full text-sm rounded-md border-white/20 bg-gray-800 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" placeholder="https://innovatehub.com" />
                                        <button type="button" onClick={() => removeSocialLink(index)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-800 rounded-full h-7 w-7 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addSocialLink} className="w-full py-2 text-sm font-medium text-[#88B1FF] bg-[#0057FF]/10 rounded-md hover:bg-[#0057FF]/20">
                                    {t('createProject.addSocialLink')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white text-glow">{t('createProject.aiAssistants')}</h2>
                        <p className="text-gray-400">{t('createProject.aiAssistantsDesc')}</p>
                        <div className="p-4 bg-black/20 rounded-md border border-white/10">
                            <h3 className="font-semibold text-white">{t('createProject.rewardTiers')}</h3>
                            <p className="text-sm text-gray-400 mt-1">{t('createProject.rewardTiersDesc')}</p>
                             <button type="button" onClick={handleSuggestRewards} disabled={isAiWorking} className="mt-3 w-full text-sm inline-flex items-center justify-center px-4 py-2 border border-transparent font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF]/80 to-[#004AD8]/80 hover:opacity-90 disabled:opacity-50">
                                <SparklesIcon className={`mr-2 h-4 w-4 ${isAiWorking ? 'animate-spin' : ''}`} />
                                {formData.rewards.length > 1 ? t('createProject.regenerateRewards') : t('createProject.suggestRewards')}
                            </button>
                        </div>
                         <div className="p-4 bg-black/20 rounded-md border border-white/10">
                            <h3 className="font-semibold text-white">{t('createProject.faqSection')}</h3>
                            <p className="text-sm text-gray-400 mt-1">{t('createProject.faqSectionDesc')}</p>
                             <button type="button" onClick={handleGenerateFaqs} disabled={isAiWorking} className="mt-3 w-full text-sm inline-flex items-center justify-center px-4 py-2 border border-transparent font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF]/80 to-[#004AD8]/80 hover:opacity-90 disabled:opacity-50">
                                <SparklesIcon className={`mr-2 h-4 w-4 ${isAiWorking ? 'animate-spin' : ''}`} />
                                 {formData.faq.length > 0 ? t('createProject.regenerateFaqs') : t('createProject.generateFaqs')}
                            </button>
                        </div>
                    </div>
                )}
                 {step === 4 && (
                     <div className="space-y-4">
                         <h3 className="text-lg font-medium text-white">{t('createProject.setupRewards')}</h3>
                         {formData.rewards.map((reward, index) => (
                             <div key={index} className="p-4 bg-black/20 rounded-md space-y-3 relative border border-white/10">
                                <input type="text" placeholder="Reward Title" value={reward.title} onChange={(e) => handleRewardChange(index, 'title', e.target.value)} className="block w-full text-sm rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" />
                                <input type="number" placeholder="Pledge Amount" value={reward.pledgeAmount} onChange={(e) => handleRewardChange(index, 'pledgeAmount', Number(e.target.value))} className="block w-full text-sm rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" />
                                <textarea placeholder="Reward Description" value={reward.description} onChange={(e) => handleRewardChange(index, 'description', e.target.value)} rows={2} className="block w-full text-sm rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" />
                                {formData.rewards.length > 1 && (
                                    <button type="button" onClick={() => removeReward(index)} className="absolute -top-2 -right-2 text-gray-400 hover:text-red-500 bg-gray-800 rounded-full h-6 w-6 flex items-center justify-center font-bold text-lg">
                                       &times;
                                    </button>
                                )}
                             </div>
                         ))}
                         <button type="button" onClick={addReward} className="w-full py-2 text-sm font-medium text-[#88B1FF] bg-[#0057FF]/10 rounded-md hover:bg-[#0057FF]/20">
                             {t('createProject.addReward')}
                         </button>
                     </div>
                 )}
                 {step === 5 && (
                    <div className="space-y-6 text-center">
                         <h2 className="text-2xl font-bold text-white text-glow">{t('createProject.aiLaunchReadiness')}</h2>
                         {formData.analysis ? (
                             <div className="text-left space-y-4">
                                <div className="text-center">
                                    <p className="text-gray-400">{t('createProject.yourScore')}</p>
                                    <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0057FF] to-[#3385FF] text-glow-accent">{formData.analysis.score}/100</p>
                                </div>
                                <h3 className="font-semibold text-white">{t('createProject.suggestions')}</h3>
                                <ul className="space-y-2 list-disc list-inside text-gray-300">
                                    {formData.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                                <button
                                  type="button"
                                  onClick={nextStep}
                                  className="!mt-8 w-full inline-flex justify-center rounded-full border border-transparent bg-gradient-to-r from-[#0057FF] to-[#004AD8] py-3 px-6 text-base font-medium text-white shadow-lg shadow-[#0057FF]/30 hover:opacity-90"
                                >
                                  {t('createProject.nextLaunch')}
                                </button>
                                <button type="button" onClick={handleAnalyzeCampaign} disabled={isAnalyzing} className="w-full text-sm mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent font-semibold rounded-full text-white bg-white/10 hover:bg-white/20">
                                    {t('createProject.reanalyze')}
                                 </button>
                             </div>
                         ) : (
                             <div>
                                 <p className="text-gray-400 mb-4">{t('createProject.getFeedback')}</p>
                                 <button type="button" onClick={handleAnalyzeCampaign} disabled={isAnalyzing} className="w-full relative inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-full text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <BrainCircuitIcon className={`mr-2 h-5 w-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                    {isAnalyzing ? t('createProject.analyzing') : t('createProject.analyzeCampaign')}
                                 </button>
                             </div>
                         )}
                    </div>
                 )}
                 {step === 6 && (
                    <div className="space-y-6">
                         <h2 className="text-2xl font-bold text-white text-glow text-center">{t('createProject.finalCheck')}</h2>
                         <div>
                            <label htmlFor="creatorBio" className="block text-sm font-medium text-gray-300">{t('createProject.shortBio')}</label>
                            <input type="text" id="creatorBio" value={formData.creatorBio} onChange={handleChange} className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" placeholder="Tell us about yourself" required/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-300">{t('createProject.city')}</label>
                                <input type="text" id="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]" placeholder="e.g., Tokyo" required/>
                            </div>
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-300">{t('createProject.country')}</label>
                                <select
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-white/20 bg-[#001641]/50 text-white focus:border-[#0057FF] focus:ring-[#0057FF]"
                                    required
                                >
                                    <option value="" disabled>{t('createProject.selectCountry')}</option>
                                    {countries.map(c => (
                                        <option key={c.code || c.name} value={c.code} disabled={c.disabled}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-gray-300">{t('createProject.fundingGoal')}</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-400 sm:text-sm">$</span></div>
                                <input type="number" id="goal" value={formData.goal} onChange={handleChange} className="block w-full rounded-md border-white/20 bg-[#001641]/50 text-white pl-7 pr-12 focus:border-[#0057FF] focus:ring-[#0057FF]" min="1" required/>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-400 sm:text-sm">USD</span></div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 pt-4 text-center">{t('createProject.disclaimer')}</p>
                    </div>
                )}
                </motion.div>
                </AnimatePresence>
                <div className="flex justify-between items-center pt-6 border-t border-white/10 mt-8">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="px-6 py-2 text-sm font-medium text-gray-300 bg-white/5 rounded-full hover:bg-white/10 border border-white/10">
                           {t('createProject.previous')}
                       </button>
                    ) : ( <button type="button" onClick={onBack} className="px-6 py-2 text-sm font-medium text-gray-300 bg-white/5 rounded-full hover:bg-white/10 border border-white/10">{t('createProject.cancel')}</button>)}
                    
                    {step < STEPS.length ? (
                         step !== 5 && <button type="button" onClick={nextStep} className="inline-flex justify-center rounded-full border border-transparent bg-gradient-to-r from-[#0057FF] to-[#004AD8] py-2 px-6 text-sm font-medium text-white shadow-lg shadow-[#0057FF]/30 hover:opacity-90">{t('createProject.next')}</button>
                    ) : (
                         <button type="submit" className="inline-flex justify-center rounded-full border border-transparent bg-gradient-to-r from-green-500 to-emerald-600 py-2 px-6 text-sm font-medium text-white shadow-lg shadow-green-500/30 hover:opacity-90">{t('createProject.launchProject')}</button>
                    )}
                </div>
            </form>
        </div>
    </div>
  );
};

export default CreateProjectForm;