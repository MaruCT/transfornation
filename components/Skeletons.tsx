import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard: React.FC = () => (
    <div className="relative rounded-2xl overflow-hidden flex flex-col bg-[#001641]/50 border border-white/10 p-4 space-y-4">
        <div className="w-full h-40 bg-white/10 rounded-lg animate-pulse"></div>
        <div className="w-3/4 h-6 bg-white/10 rounded animate-pulse"></div>
        <div className="w-full h-4 bg-white/10 rounded animate-pulse"></div>
        <div className="w-1/2 h-4 bg-white/10 rounded animate-pulse"></div>
         <div className="pt-4 mt-auto">
            <div className="w-full h-1.5 bg-black/30 rounded-full">
                <div className="w-1/2 h-1.5 bg-white/10 rounded-full animate-pulse"></div>
            </div>
        </div>
    </div>
);

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


const ProjectListSkeleton: React.FC = () => {
    return (
        <div className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Featured project skeleton */}
                <div className="mb-20 rounded-3xl p-8 md:p-12 min-h-[500px] flex flex-col justify-end border border-white/10 bg-[#001641]/50">
                    <div className="w-1/4 h-4 bg-white/10 rounded animate-pulse mb-4"></div>
                    <div className="w-3/4 h-12 bg-white/10 rounded animate-pulse mb-4"></div>
                    <div className="w-1/2 h-6 bg-white/10 rounded animate-pulse"></div>
                </div>
                {/* Stats skeleton */}
                <div className="mb-20 rounded-2xl p-8 min-h-[300px] border border-white/10 bg-[#001641]/50 animate-pulse"></div>
                
                {/* Category filters skeleton */}
                <div className="flex justify-center flex-wrap gap-3 mb-12">
                    <div className="w-20 h-9 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="w-24 h-9 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="w-16 h-9 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="w-28 h-9 bg-white/10 rounded-full animate-pulse"></div>
                </div>

                <motion.div 
                    className="masonry-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[...Array(6)].map((_, i) => (
                        <motion.div key={i} variants={itemVariants} className="masonry-item">
                            <SkeletonCard />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectListSkeleton;