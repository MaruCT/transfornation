import { Plus, Trash2 } from 'lucide-react';
import type { TeamMember } from '../types';
import ImageUploadField from './ImageUploadField';

interface TeamEditorProps {
  team: TeamMember[];
  onChange: (team: TeamMember[]) => void;
}

export default function TeamEditor({ team, onChange }: TeamEditorProps) {
  const addMember = () => {
    onChange([...team, { name: '', role: '', avatar: '' }]);
  };

  const removeMember = (index: number) => {
    onChange(team.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...team];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Team Members
        </label>
        <button
          type="button"
          onClick={addMember}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {team.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          No team members added yet
        </p>
      ) : (
        <div className="space-y-4">
          {team.map((member, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">Member #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="CEO, Developer, Designer..."
                    required
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Avatar"
                  value={member.avatar}
                  onChange={(url) => updateMember(index, 'avatar', url)}
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
