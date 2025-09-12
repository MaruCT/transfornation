import React from 'react';
import { motion } from 'framer-motion';
import type { Project, User } from '../types';
import ProjectCard from './ProjectCard';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectListProps {
  projects: Project[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectProject: (project: Project) => void;
  currentUser: User | null;
  onToggleFavorite: (projectId: string) => void;
}

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

const ProjectList: React.FC<ProjectListProps> = ({ projects, categories, selectedCategory, onSelectCategory, onSelectProject, currentUser, onToggleFavorite }) => {
  const { t } = useLanguage();
  const featuredProject = React.useMemo(() => {
    if (projects.length === 0) return null;
    const featured = projects.filter(p => p.isFeatured);
    if (featured.length > 0) {
      return [...featured].sort((a, b) => b.pledged - a.pledged)[0];
    }
    return [...projects].sort((a,b) => b.pledged - a.pledged)[0];
  }, [projects]);
  
  const visibleProjects = projects;

  return (
    <div className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {featuredProject && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-20 relative rounded-3xl overflow-hidden text-white p-8 md:p-12 min-h-[500px] flex flex-col justify-end border border-white/10"
            style={{
                background: 'rgba(0, 22, 65, 0.4)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <img src={featuredProject.imageUrl} alt={featuredProject.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>

            <div className="relative z-10">
              <span className="text-sm font-bold uppercase tracking-widest text-[#0057FF] text-glow-accent">{t('projectList.featured')}</span>
              <h1 className="text-4xl md:text-6xl font-extrabold mt-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 text-glow">{featuredProject.title}</h1>
              <p className="mt-4 max-w-2xl text-lg text-gray-300">{featuredProject.tagline}</p>
              <button onClick={() => onSelectProject(featuredProject)} className="mt-8 relative inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8] hover:from-[#0057FF] hover:to-[#004AD8] shadow-lg shadow-[#0057FF]/30 hover:shadow-[#0057FF]/40 transition-all duration-300 transform hover:scale-105">
                {t('projectList.viewProject')}
              </button>
            </div>
          </motion.div>
        )}
        
        <div className="flex justify-center flex-wrap gap-3 mb-12">
          {[t('projectList.all'), ...categories].map(category => (
             <button 
                key={category} 
                onClick={() => onSelectCategory(category === t('projectList.all') ? 'All' : category)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 outline-none border ${
                  selectedCategory === (category === t('projectList.all') ? 'All' : category)
                  ? 'bg-white/10 text-white shadow-md border-white/20' 
                  : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white border-white/10'
                }`}
             >
                {category}
             </button>
          ))}
        </div>

        <motion.div 
          className="masonry-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {visibleProjects.map(project => (
            <motion.div key={project.id} variants={itemVariants} className="masonry-item">
                <ProjectCard 
                    project={project} 
                    onSelectProject={onSelectProject} 
                    currentUser={currentUser}
                    onToggleFavorite={onToggleFavorite}
                />
            </motion.div>
          ))}
        </motion.div>
        
      </div>
    </div>
  );
};

export default ProjectList;