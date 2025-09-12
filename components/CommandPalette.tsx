import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../types';
import { SparklesIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, setIsOpen, projects, onSelectProject, onCreateProject }) => {
  const [query, setQuery] = useState('');
  const { t } = useLanguage();
  
  const filteredProjects = query
    ? projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (project: Project) => {
      onSelectProject(project);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-xl bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('commandPalette.placeholder')}
                className="w-full bg-transparent border-b border-white/10 text-white px-6 py-4 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query && filteredProjects.length > 0 && (
                <ul className="space-y-1">
                  {filteredProjects.map(project => (
                    <li
                      key={project.id}
                      onClick={() => handleSelect(project)}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      <img src={project.imageUrl} alt={project.title} className="w-12 h-8 rounded object-cover" />
                      <div className="flex-grow">
                          <p className="font-semibold text-white truncate">{project.title}</p>
                          <p className="text-sm text-gray-400">{project.category}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {query && filteredProjects.length === 0 && (
                  <p className="text-center text-gray-400 p-6">{t('commandPalette.noProjects', { query })}</p>
              )}
               {!query && (
                    <div className="p-4">
                        <button
                          onClick={onCreateProject}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer w-full text-left"
                        >
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-[#0057FF]"/>
                          </div>
                          <p className="font-semibold text-white">{t('commandPalette.createProject')}</p>
                        </button>
                    </div>
                )}
            </div>
             <div className="bg-black/20 p-2 text-center text-xs text-gray-500 border-t border-white/10" dangerouslySetInnerHTML={{ __html: t('commandPalette.tooltip') }}>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;