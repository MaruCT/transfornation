import { Plus, Trash2 } from 'lucide-react';
import type { Reward } from '../types';

interface RewardsEditorProps {
  rewards: Reward[];
  onChange: (rewards: Reward[]) => void;
}

export default function RewardsEditor({ rewards, onChange }: RewardsEditorProps) {
  const addReward = () => {
    onChange([...rewards, { title: '', pledgeAmount: 0, description: '', isFoundersPass: false }]);
  };

  const removeReward = (index: number) => {
    onChange(rewards.filter((_, i) => i !== index));
  };

  const updateReward = (index: number, field: keyof Reward, value: string | number | boolean) => {
    const updated = [...rewards];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Rewards
        </label>
        <button
          type="button"
          onClick={addReward}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Reward
        </button>
      </div>

      {rewards.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          No rewards added yet
        </p>
      ) : (
        <div className="space-y-4">
          {rewards.map((reward, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">Reward #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeReward(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reward Title *
                  </label>
                  <input
                    type="text"
                    value={reward.title}
                    onChange={(e) => updateReward(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="Early Bird Special"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pledge Amount ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={reward.pledgeAmount}
                    onChange={(e) => updateReward(index, 'pledgeAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="25.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={reward.description}
                  onChange={(e) => updateReward(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                  placeholder="What backers get with this reward..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`founders-pass-${index}`}
                  checked={reward.isFoundersPass || false}
                  onChange={(e) => updateReward(index, 'isFoundersPass', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor={`founders-pass-${index}`} className="text-xs text-gray-700">
                  This is a Founder's Pass
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
