import { Plus, Trash2 } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQEditorProps {
  faqs: FAQ[];
  onChange: (faqs: FAQ[]) => void;
}

export default function FAQEditor({ faqs, onChange }: FAQEditorProps) {
  const addFAQ = () => {
    onChange([...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    onChange(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          FAQ (Frequently Asked Questions)
        </label>
        <button
          type="button"
          onClick={addFAQ}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {faqs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          No FAQs added yet
        </p>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">Question #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFAQ(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                  placeholder="What is...?"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Answer *
                </label>
                <textarea
                  rows={3}
                  value={faq.answer}
                  onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                  placeholder="The answer is..."
                  required
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
