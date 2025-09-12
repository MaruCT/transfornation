import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../types';
import { XIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface LiveActivityFeedProps {
    projects: Project[];
    onSelectProject: (project: Project) => void;
}

interface Activity {
    id: number;
    text: string;
    project: Project;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ projects, onSelectProject }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        if (projects.length === 0) return;

        const interval = setInterval(() => {
            const randomProject = projects[Math.floor(Math.random() * projects.length)];
            const randomAmount = Math.floor(Math.random() * 200) + 10;
            const newActivity: Activity = {
                id: Date.now(),
                text: t('liveFeed.backed', { amount: `$${randomAmount}`}),
                project: randomProject,
            };

            setActivities(prev => [newActivity, ...prev].slice(0, 5)); // Keep max 5 activities

            setTimeout(() => {
                setActivities(prev => prev.filter(a => a.id !== newActivity.id));
            }, 5000); // Remove after 5 seconds

        }, 7000); // New activity every 7 seconds

        return () => clearInterval(interval);

    }, [projects, t]);

    const handleRemove = (id: number) => {
        setActivities(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 w-full max-w-sm">
            <AnimatePresence>
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        layout
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                        style={{
                            marginBottom: index === activities.length - 1 ? 0 : '1rem'
                        }}
                        className="relative bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-4 flex items-center cursor-pointer"
                        onClick={() => onSelectProject(activity.project)}
                    >
                        {activity.project.imageUrl ? (
                            <img src={activity.project.imageUrl} alt={activity.project.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 mr-4" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg object-cover flex-shrink-0 mr-4 bg-gray-700" />
                        )}
                        <div className="flex-grow min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{activity.project.title}</p>
                            <p className="text-sm text-[#88B1FF]">{activity.text}</p>
                        </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleRemove(activity.id); }} 
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            aria-label="Dismiss notification"
                         >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default LiveActivityFeed;