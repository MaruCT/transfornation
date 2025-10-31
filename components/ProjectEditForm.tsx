import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import type { Project, MediaItem, TeamMember, SocialLink, Reward, RoadmapStep } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import MediaUploader from './MediaUploader';
import ImageUploadField from './ImageUploadField';
import TeamEditor from './TeamEditor';
import SocialLinksEditor from './SocialLinksEditor';
import FAQEditor from './FAQEditor';
import RoadmapEditor from './RoadmapEditor';
import RewardsEditor from './RewardsEditor';

interface ProjectEditFormProps {
  project: Project | null;
  onSave: (project: Partial<Project>) => Promise<void>;
  onClose: () => void;
}

export default function ProjectEditForm({ project, onSave, onClose }: ProjectEditFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    creator: '',
    creatorBio: '',
    creatorAvatar: '',
    tagline: '',
    description: '',
    problems: '',
    category: 'Tech',
    imageUrl: '',
    goal: 0,
    pledged: 0,
    backers: 0,
    city: '',
    country: '',
    anticipationScore: 75,
    impactScore: 75,
    efficiencyScore: 75,
  });

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        creator: project.creator || '',
        creatorBio: project.creatorBio || '',
        creatorAvatar: project.creatorAvatar || '',
        tagline: project.tagline || '',
        description: project.description || '',
        problems: project.problems || '',
        category: project.category || 'Tech',
        imageUrl: project.imageUrl || '',
        goal: project.goal || 0,
        pledged: project.pledged || 0,
        backers: project.backers || 0,
        city: project.city || '',
        country: project.country || '',
        anticipationScore: project.anticipationScore || 75,
        impactScore: project.impactScore || 75,
        efficiencyScore: project.efficiencyScore || 75,
      });
      setRewards(project.rewards || []);
      setFaqs(project.faq || []);
      setTeam(project.team || []);
      setSocialLinks(project.socialLinks || []);
      setRoadmap(project.roadmap || []);
      setMedia(project.media || []);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        ...formData,
        id: project?.id,
        rewards,
        faq: faqs,
        team,
        socialLinks,
        roadmap,
        media,
      });
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['Tech', 'Art', 'Music', 'Game', 'Robotech', 'General'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-[9999] overflow-y-auto pt-24">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg w-full max-w-4xl my-8"
      >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {project ? t('admin.editProject') : t('admin.createProject')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.title')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Enter project title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.category')} *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.creator')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.creator}
                    onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Creator name"
                  />
                </div>

                <div>
                  <ImageUploadField
                    label={t('admin.form.creatorAvatar')}
                    value={formData.creatorAvatar}
                    onChange={(url) => setFormData({ ...formData, creatorAvatar: url })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.form.tagline')}
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Short description"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.form.description')} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Detailed project description"
                />
              </div>

              {/* Creator Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.form.creatorBio')}
                </label>
                <textarea
                  rows={2}
                  value={formData.creatorBio}
                  onChange={(e) => setFormData({ ...formData, creatorBio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="About the creator"
                />
              </div>

              {/* Image & Funding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ImageUploadField
                    label={t('admin.form.imageUrl')}
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    required
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.goal')} ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.pledged')} ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pledged}
                    onChange={(e) => setFormData({ ...formData, pledged: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.backers')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.backers}
                    onChange={(e) => setFormData({ ...formData, backers: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.city')}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="City name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.country')}
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="US, KZ, etc"
                  />
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.anticipationScore')} (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.anticipationScore}
                    onChange={(e) => setFormData({ ...formData, anticipationScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.impactScore')} (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.impactScore}
                    onChange={(e) => setFormData({ ...formData, impactScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.form.efficiencyScore')} (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.efficiencyScore}
                    onChange={(e) => setFormData({ ...formData, efficiencyScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Media Gallery */}
              <div className="border-t pt-6">
                <MediaUploader media={media} onChange={setMedia} />
              </div>

              {/* Rewards */}
              <div className="border-t pt-6 mt-6">
                <RewardsEditor rewards={rewards} onChange={setRewards} />
              </div>

              {/* Team Members */}
              <div className="border-t pt-6 mt-6">
                <TeamEditor team={team} onChange={setTeam} />
              </div>

              {/* Social Links */}
              <div className="border-t pt-6 mt-6">
                <SocialLinksEditor socialLinks={socialLinks} onChange={setSocialLinks} />
              </div>

              {/* FAQ */}
              <div className="border-t pt-6 mt-6">
                <FAQEditor faqs={faqs} onChange={setFaqs} />
              </div>

              {/* Roadmap */}
              <div className="border-t pt-6 mt-6">
                <RoadmapEditor roadmap={roadmap} onChange={setRoadmap} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
              disabled={saving}
            >
              {t('admin.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {t('admin.form.save')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
