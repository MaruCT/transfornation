import React from 'react';
import { motion } from 'framer-motion';
import type { Event } from '../types';
import { BackArrowIcon } from './Icons';

interface EventDetailProps {
  event: Event;
  onBack: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onBack}
        className="flex items-center text-sm font-medium text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <BackArrowIcon className="h-5 w-5 mr-2" />
        Back to Events
      </motion.button>

      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-8"
        >
          <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-glow"
        >
          {event.title}
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 flex items-center space-x-6 text-gray-400"
        >
            <span>{event.date}</span>
            <span>&bull;</span>
            <span>{event.location}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 prose prose-slate dark:prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white"
        >
          <p>{event.description}</p>
        </motion.div>

        {event.speakers && event.speakers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white text-glow">Featured Speakers</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {event.speakers.map((speaker, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <img src={speaker.avatar} alt={speaker.name} className="h-16 w-16 rounded-full border-2 border-white/20" />
                  <div>
                    <h3 className="font-bold text-white">{speaker.name}</h3>
                    <p className="text-sm text-[#88B1FF]">{speaker.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;