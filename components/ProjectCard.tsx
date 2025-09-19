import React from 'react';
import { motion } from 'framer-motion';
import type { Project, User } from '../types';
import { DiamondIcon, TrendingUpIcon, HeartIcon, LocationPinIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectCardProps {
  project: Project;
  onSelectProject: (project: Project) => void;
  className?: string;
  currentUser: User | null;
  onToggleFavorite: (projectId: string) => void;
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => (
    <svg width="100" height="20" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={`M ${data.map((d, i) => `${i * (100 / (data.length - 1))} ${20 - d * 1.5}`).join(' L ')}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelectProject, className, currentUser, onToggleFavorite }) => {
  const { t } = useLanguage();
  const progressPercentage = project.goal > 0 ? Math.min((project.pledged / project.goal) * 100, 100) : 0;
  const isFavorited = currentUser && project.favoritedBy.includes(currentUser.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };
  
  const hasFoundersPass = project.rewards.some(r => r.isFoundersPass);

  const velocityMap = {
      'trending_up': { color: 'text-green-400', label: t('projectCard.trendingUp'), data: [1, 5, 3, 8, 6, 10, 9] },
      'stable': { color: 'text-yellow-400', label: t('projectCard.stable'), data: [4, 5, 5, 4, 6, 5, 5] },
      'slowing': { color: 'text-red-400', label: t('projectCard.slowing'), data: [9, 8, 6, 7, 5, 4, 2] },
  } as const;
  const velocityData = velocityMap[project.fundingVelocity as keyof typeof velocityMap] || velocityMap['stable'];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(project.id);
  };

  return (
    <motion.div 
      className={`relative rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-300 isolate project-card ${className}`}
      onClick={() => onSelectProject(project)}
      layoutId={`project-card-${project.id}`}
      whileHover={{ y: -4, scale: 1.02 }} // Reduced hover effect for better mobile performance
      style={{
        background: 'rgba(0, 22, 65, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        // Optimize for mobile scrolling
        willChange: 'auto',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Base border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300 z-0"></div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0057FF]/20 to-[#004AD8]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
      
       {/* Chromatic Aberration Hover Border */}
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 0 1px #00f, 0 0 0 1px #f00', mixBlendMode: 'overlay' }}></div>
      </div>
      
      <div className="relative overflow-hidden z-20">
        <motion.img 
            className="w-full h-auto aspect-video object-cover transition-transform duration-500 group-hover:scale-105" 
            src={project.imageUrl} 
            alt={project.title} 
            layoutId={`project-image-${project.id}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
         <span className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">{project.category}</span>
         {project.isFeatured && (
            <span className="absolute top-4 left-28 bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-fuchsia-400/40 shadow-lg">
              Featured
            </span>
         )}
         {hasFoundersPass && (
            <div className="absolute top-4 right-4 flex items-center bg-gradient-to-r from-yellow-400/30 to-orange-500/30 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-yellow-400/40 shadow-lg">
                <DiamondIcon className="h-3 w-3 mr-1.5 text-yellow-300" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}} />
                {t('projectCard.foundersPass')}
            </div>
         )}
         {currentUser && (
            <button 
                onClick={handleFavoriteClick}
                className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Favorite project"
            >
                <HeartIcon className={`h-5 w-5 transition-colors ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} />
            </button>
         )}
      </div>
      <div className="p-5 flex flex-col flex-grow z-20">
        <motion.h3 
            className="text-lg font-bold text-white text-glow"
            layoutId={`project-title-${project.id}`}
        >
            {project.title}
        </motion.h3>
        <p className="mt-2 text-gray-400 text-sm flex-grow">{project.tagline}</p>
        
        <div className="flex items-center mt-4 text-sm text-gray-400">
            <img className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20" src={project.creatorAvatar} alt={project.creator} />
            <p className="ml-3 font-medium text-gray-300">by {project.creator}</p>
            <span className="mx-2 text-gray-600">·</span>
            <div className="flex items-center">
                <LocationPinIcon className="h-4 w-4 mr-1"/>
                <span>{project.city}, {project.country}</span>
            </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-semibold text-[#88B1FF] text-glow-accent">{formatCurrency(project.pledged)}</span>
            <span className="text-gray-500">of {formatCurrency(project.goal)}</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#0057FF] to-[#004AD8] h-1.5 rounded-full"
              style={{ width: `${progressPercentage}%`, boxShadow: `0 0 8px var(--accent-glow-color)` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
             <span>{project.backers.toLocaleString()} {t('projectCard.backers')}</span>
             <div className={`flex items-center ${velocityData.color}`}>
                <TrendingUpIcon className="h-3.5 w-3.5 mr-1" />
                <span className="font-medium">{velocityData.label}</span>
             </div>
             <span className="font-medium">{Math.round(progressPercentage)}% {t('projectCard.funded')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;