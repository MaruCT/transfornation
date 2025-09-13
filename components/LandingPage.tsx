import React, { useMemo } from 'react';
// FIX: Import `Variants` type from framer-motion to correctly type animation variants.
import { motion, Variants } from 'framer-motion';
import type { Project } from '../types';
import { ArrowRightIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const cardHoverVariants = {
    rest: { opacity: 0 },
    hover: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// FIX: Explicitly define the type of itemVariants as `Variants` to satisfy TypeScript's strict type checking for the `ease` property.
const itemVariants: Variants = {
    rest: { y: 15, opacity: 0 },
    hover: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};


const ProjectMarqueeCard: React.FC<{ project: Project; onSelectProject: (p: Project) => void; }> = ({ project, onSelectProject }) => {
    const { t } = useLanguage();
    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            animate="rest"
            className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden group flex-shrink-0 cursor-pointer border border-white/20 bg-[#001641]/50 backdrop-blur-sm shadow-lg shadow-black/40 opacity-40 hover:opacity-100 transition-all duration-300 hover:border-[#0057FF]/70 hover:shadow-2xl hover:shadow-[#0057FF]/20 hover:-translate-y-1"
            onClick={() => onSelectProject(project)}
        >
            {project.imageUrl && project.imageUrl.trim() !== '' ? (
                <img 
                    src={project.imageUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 brightness-75 group-hover:brightness-100"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700" />
            )}
            <motion.div 
                variants={cardHoverVariants}
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-start justify-end p-4 text-left"
            >
                <motion.h3 
                    variants={itemVariants}
                    className="text-white font-bold text-base drop-shadow-lg"
                >
                    {project.title}
                </motion.h3>
                <motion.div 
                    variants={itemVariants}
                    className="mt-2"
                >
                    <div className="flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full text-white bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                        {t('landing.viewProject')}
                        <ArrowRightIcon className="h-3 w-3 ml-1.5" />
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};


interface LandingPageProps {
    projects: Project[];
    categories: string[];
    onSelectProject: (project: Project) => void;
    onSelectCategory: (category: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ projects, categories, onSelectProject, onSelectCategory }) => {
    const { t } = useLanguage();
    
    const projectRows = useMemo(() => {
        if (projects.length === 0) return [];
        // Shuffle and extend to ensure rows are full enough for a seamless loop
        const shuffled = shuffleArray(projects);
        const extendedProjects = [...shuffled, ...shuffled, ...shuffled, ...shuffled].slice(0, 21); // Cap at 21 to have 7 per row
        
        const numRows = 3;
        const rows: Project[][] = Array.from({ length: numRows }, () => []);
        extendedProjects.forEach((project, index) => {
            rows[index % numRows].push(project);
        });
        return rows;
    }, [projects]);

    return (
        <div>
            {/* Hero Section */}
            <div className="relative h-screen min-h-[800px] flex items-center justify-center text-center text-white overflow-hidden -mt-20">
                {/* Animated Background */}
                <div className="absolute inset-0 flex flex-col justify-center gap-8 pointer-events-auto">
                   {projectRows.map((row, rowIndex) => {
                       if (row.length === 0) return null;
                       const isLeft = rowIndex % 2 === 0;
                       const duration = 80 + rowIndex * 10;
                       return (
                           <div key={rowIndex} className="marquee-row">
                               <div 
                                className={`marquee-content flex items-center ${isLeft ? 'animate-scroll-left' : 'animate-scroll-right'}`}
                                style={{ animationDuration: `${duration}s`}}
                               >
                                  {[...row, ...row].map((project, projIndex) => (
                                     <div className="w-56 md:w-72 lg:w-80 px-3 flex-shrink-0" key={`${project.id}-${projIndex}-${rowIndex}`}>
                                         <ProjectMarqueeCard project={project} onSelectProject={onSelectProject} />
                                     </div>
                                  ))}
                               </div>
                           </div>
                       )
                   })}
                </div>
                
                {/* Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-radial from-black/5 via-black/40 to-black/80 z-10 pointer-events-none" />

                <div className="relative z-20 px-4 py-8">
                    <motion.h1 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text bg-gradient-to-br from-white to-gray-300 text-glow"
                    >
                        {t('landing.title')}
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        className="mt-4 max-w-2xl mx-auto text-lg text-gray-300"
                    >
                        {t('landing.subtitle')}
                    </motion.p>
                    <motion.div 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                        className="mt-8"
                    >
                        <button 
                            onClick={() => onSelectCategory('All')} 
                            className="relative inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8] hover:from-[#0057FF] hover:to-[#004AD8] shadow-lg shadow-[#0057FF]/30 hover:shadow-[#0057FF]/40 transition-all duration-300 transform hover:scale-105"
                        >
                            {t('landing.exploreButton')}
                        </button>
                    </motion.div>
                     <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }} 
                        className="mt-12"
                    >
                        <p className="text-sm text-gray-400 mb-4">{t('landing.orJumpTo')}</p>
                        <div className="flex justify-center flex-wrap gap-3">
                            {categories.slice(0, 5).map(category => (
                                <button 
                                    key={category} 
                                    onClick={() => onSelectCategory(category)}
                                    className="px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 outline-none border bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10"
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;