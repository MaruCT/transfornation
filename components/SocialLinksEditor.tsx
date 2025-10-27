import { Plus, Trash2 } from 'lucide-react';
import type { SocialLink } from '../types';

interface SocialLinksEditorProps {
  socialLinks: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

const PLATFORMS: Array<SocialLink['platform']> = ['twitter', 'instagram', 'facebook', 'website'];

export default function SocialLinksEditor({ socialLinks, onChange }: SocialLinksEditorProps) {
  const addLink = () => {
    onChange([...socialLinks, { platform: 'website', url: '' }]);
  };

  const removeLink = (index: number) => {
    onChange(socialLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Social Links
        </label>
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {socialLinks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          No social links added yet
        </p>
      ) : (
        <div className="space-y-3">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-3">
              <select
                value={link.platform}
                onChange={(e) => updateLink(index, 'platform', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
              >
                {PLATFORMS.map(platform => (
                  <option key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(index, 'url', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                placeholder="https://..."
                required
              />

              <button
                type="button"
                onClick={() => removeLink(index)}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
