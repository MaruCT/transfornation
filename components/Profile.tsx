import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Pledge, Project } from '../types';
import ProjectCard from './ProjectCard';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileProps {
  user: User;
  pledges: Pledge[];
  favoriteProjects: Project[];
  createdProjects: Project[];
  onSelectProject: (project: Project) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const Profile: React.FC<ProfileProps> = ({ user, pledges, favoriteProjects, createdProjects, onSelectProject }) => {
  const { t } = useLanguage();
  const TABS = [t('profile.tabs.pledges'), t('profile.tabs.favorites'), t('profile.tabs.creations')];
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-6 mb-12">
        <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full ring-4 ring-white/10" />
        <div>
          <h1 className="text-4xl font-extrabold text-white text-glow">{t('profile.welcome', { name: user.name })}</h1>
          <p className="text-gray-400 mt-1">{t('profile.subtitle')}</p>
        </div>
      </div>
      
      <div className="border-b border-white/10 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
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

      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === t('profile.tabs.pledges') && (
              <div className="space-y-4">
                {pledges.length > 0 ? (
                  pledges.map((pledge) => (
                    <div key={pledge.projectId} className="flex items-center p-4 rounded-lg bg-[#001641]/50 border border-white/10">
                      <img src={pledge.projectImageUrl} alt={pledge.projectTitle} className="h-16 w-16 rounded-md object-cover"/>
                      <div className="ml-4 flex-grow">
                        <p className="font-bold text-white">{pledge.projectTitle}</p>
                        <p className="text-sm text-gray-400">{t('profile.reward', { rewardTitle: pledge.rewardTitle })}</p>
                      </div>
                      <p className="text-lg font-semibold text-[#88B1FF]">{formatCurrency(pledge.amount)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">{t('profile.noPledges')}</p>
                )}
              </div>
            )}
            
            {(activeTab === t('profile.tabs.favorites') || activeTab === t('profile.tabs.creations')) && (
              <motion.div
                className="masonry-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {(activeTab === t('profile.tabs.favorites') ? favoriteProjects : createdProjects).length > 0 ? (
                  (activeTab === t('profile.tabs.favorites') ? favoriteProjects : createdProjects).map(project => (
                     <motion.div key={project.id} variants={itemVariants} className="masonry-item">
                        <ProjectCard 
                            project={project} 
                            onSelectProject={onSelectProject} 
                            // Dummy props as they are not used in this context but required by the component
                            currentUser={user} 
                            onToggleFavorite={() => {}}
                        />
                    </motion.div>
                  ))
                ) : (
                   <p className="text-gray-400 text-center py-8 col-span-1 md:col-span-2 lg:col-span-3">
                     {activeTab === t('profile.tabs.favorites') ? t('profile.noFavorites') : t('profile.noCreations')}
                   </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;