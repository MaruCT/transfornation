import { Plus, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';
import type { RoadmapStep } from '../types';

interface RoadmapEditorProps {
  roadmap: RoadmapStep[];
  onChange: (roadmap: RoadmapStep[]) => void;
}

const STATUSES: Array<RoadmapStep['status']> = ['planned', 'in_progress', 'completed'];

export default function RoadmapEditor({ roadmap, onChange }: RoadmapEditorProps) {
  const addStep = () => {
    onChange([...roadmap, { milestone: '', description: '', status: 'planned' }]);
  };

  const removeStep = (index: number) => {
    onChange(roadmap.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof RoadmapStep, value: string) => {
    const updated = [...roadmap];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const getStatusConfig = (status: RoadmapStep['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          label: 'Completed'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Clock,
          iconColor: 'text-blue-600',
          label: 'In Progress'
        };
      case 'planned':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: Circle,
          iconColor: 'text-gray-600',
          label: 'Planned'
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Roadmap
        </label>
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      {roadmap.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          No roadmap milestones added yet
        </p>
      ) : (
        <div className="space-y-4">
          {roadmap.map((step, index) => {
            const statusConfig = getStatusConfig(step.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={index} className={`border-2 rounded-lg p-4 space-y-3 ${statusConfig.color}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                    <span className="text-sm font-medium text-gray-700">Milestone #{index + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Milestone *
                    </label>
                    <input
                      type="text"
                      value={step.milestone}
                      onChange={(e) => updateStep(index, 'milestone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm bg-white"
                      placeholder="Product Launch"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={step.status}
                      onChange={(e) => updateStep(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium bg-white"
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm bg-white"
                    placeholder="Details about this milestone..."
                    required
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
