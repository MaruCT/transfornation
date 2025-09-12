import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../types';
import { TrophyIcon, ArrowRightIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ContestViewProps {
    projects: Project[];
    onSelectProject: (project: Project) => void;
}

type AggregationLevel = 'country' | 'city';
type SortMetric = 'totalPledged' | 'avgImpact' | 'avgAnticipation' | 'projectCount';

interface AggregatedData {
    name: string;
    totalPledged: number;
    projectCount: number;
    totalImpact: number;
    totalAnticipation: number;
    countryCode?: string;
    topProject?: Project;
    projects: Project[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const ContestView: React.FC<ContestViewProps> = ({ projects, onSelectProject }) => {
    const { t } = useLanguage();
    const [level, setLevel] = useState<AggregationLevel>('country');
    const [sort, setSort] = useState<SortMetric>('totalPledged');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

    const leaderboardData = useMemo(() => {
        const aggregationMap = new Map<string, AggregatedData>();

        projects.forEach(p => {
            const key = level === 'country' ? p.country.toUpperCase() : `${p.city}, ${p.country.toUpperCase()}`;
            if (!key || (level === 'country' && !p.country) || (level === 'city' && !p.city)) return;

            if (!aggregationMap.has(key)) {
                aggregationMap.set(key, {
                    name: key,
                    totalPledged: 0,
                    projectCount: 0,
                    totalImpact: 0,
                    totalAnticipation: 0,
                    countryCode: level === 'country' ? p.country.toLowerCase() : p.country.toLowerCase(),
                    projects: [],
                });
            }

            const current = aggregationMap.get(key)!;
            current.totalPledged += p.pledged;
            current.projectCount += 1;
            current.totalImpact += p.impactScore;
            current.totalAnticipation += p.anticipationScore;
            current.projects.push(p);
        });

        aggregationMap.forEach(region => {
            if (region.projects.length > 0) {
                region.topProject = region.projects.reduce((max, p) => (p.pledged > max.pledged ? p : max), region.projects[0]);
            }
        });

        const data = Array.from(aggregationMap.values());

        return data.sort((a, b) => {
            if (sort === 'totalPledged') return b.totalPledged - a.totalPledged;
            if (sort === 'projectCount') return b.projectCount - a.projectCount;
            if (sort === 'avgImpact') return (b.totalImpact / b.projectCount) - (a.totalImpact / a.projectCount);
            if (sort === 'avgAnticipation') return (b.totalAnticipation / b.projectCount) - (a.totalAnticipation / a.projectCount);
            return 0;
        });
    }, [projects, level, sort]);
    
    const getMetricValue = (item: AggregatedData) => {
        switch (sort) {
            case 'totalPledged': return formatCurrency(item.totalPledged);
            case 'projectCount': 
                return t(item.projectCount > 1 ? 'contest.metric.projects_plural' : 'contest.metric.projects', { count: item.projectCount });
            case 'avgImpact': 
                return t('contest.metric.avgImpact', { avg: (item.totalImpact / item.projectCount).toFixed(1) });
            case 'avgAnticipation': 
                return t('contest.metric.avgHype', { avg: (item.totalAnticipation / item.projectCount).toFixed(1) });
            default: return '';
        }
    };


    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <TrophyIcon className="h-16 w-16 mx-auto text-yellow-400" style={{ filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 0.5))' }} />
                <h1 className="text-4xl md:text-5xl font-extrabold mt-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 text-glow">
                    {t('contest.title')}
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                    {t('contest.subtitle')}
                </p>
            </div>

            <div className="max-w-4xl mx-auto p-8 rounded-2xl border border-white/10" style={{background: 'rgba(0, 22, 65, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                     {/* Aggregation Level Toggle */}
                    <div className="flex items-center bg-black/20 p-1 rounded-full border border-white/10">
                        <button onClick={() => setLevel('country')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${level === 'country' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {t('contest.byCountry')}
                        </button>
                        <button onClick={() => setLevel('city')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${level === 'city' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {t('contest.byCity')}
                        </button>
                    </div>
                     {/* Sort Metric Select */}
                     <div className="flex items-center bg-black/20 p-1 rounded-full border border-white/10">
                        <button onClick={() => setSort('totalPledged')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${sort === 'totalPledged' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('contest.sort.totalPledged')}</button>
                        <button onClick={() => setSort('avgImpact')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${sort === 'avgImpact' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('contest.sort.impact')}</button>
                        <button onClick={() => setSort('avgAnticipation')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${sort === 'avgAnticipation' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('contest.sort.hype')}</button>
                        <button onClick={() => setSort('projectCount')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${sort === 'projectCount' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('contest.sort.projects')}</button>
                     </div>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-2">
                    {leaderboardData.slice(0, 15).map((item, index) => (
                        <React.Fragment key={item.name}>
                             <motion.div
                                layout
                                onClick={() => setExpandedRegion(expandedRegion === item.name ? null : item.name)}
                                className="flex items-center p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                            >
                                <div className="flex items-center w-12 text-lg font-bold text-gray-400">
                                    <span className={index < 3 ? 'text-yellow-400' : ''}>{index + 1}</span>
                                </div>
                                <div className="flex items-center flex-grow">
                                    {item.countryCode && level === 'country' && (
                                        <img
                                            src={`https://flagcdn.com/w40/${item.countryCode}.png`}
                                            alt={item.name}
                                            className="h-6 w-10 object-cover rounded-sm mr-4 border border-white/10"
                                        />
                                    )}
                                    <p className="font-semibold text-white truncate">{item.name}</p>
                                </div>
                                <div className="flex-grow flex items-center justify-end text-right">
                                    {item.topProject && (
                                        <div className="hidden md:flex items-center gap-2 mr-4 opacity-70">
                                            <span className="text-xs text-gray-500">{t('contest.topProject')}:</span>
                                            <img src={item.topProject.imageUrl} className="h-6 w-8 rounded object-cover" />
                                            <p className="text-sm font-medium text-gray-300 truncate w-32">{item.topProject.title}</p>
                                        </div>
                                    )}
                                    <div className="w-48 text-right font-mono text-[#88B1FF] text-glow-accent">
                                        {getMetricValue(item)}
                                    </div>
                                </div>
                             </motion.div>
                            <AnimatePresence>
                                {expandedRegion === item.name && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="pl-12 pr-4 pb-4 overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/10 pt-4">
                                        {item.projects.map(project => (
                                            <div key={project.id} onClick={() => onSelectProject(project)} className="bg-white/5 p-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <img src={project.imageUrl} alt={project.title} className="w-12 h-10 rounded-md object-cover flex-shrink-0" />
                                                    <div className="overflow-hidden">
                                                        <p className="font-bold text-white text-sm truncate">{project.title}</p>
                                                        <p className="text-xs text-gray-400 truncate group-hover:text-[#88B1FF] transition-colors">
                                                            {formatCurrency(project.pledged)} pledged
                                                            <ArrowRightIcon className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                    ))}
                    {leaderboardData.length === 0 && (
                        <p className="text-center text-gray-500 py-8">{t('contest.noData')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContestView;