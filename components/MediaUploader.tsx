import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Video, Loader } from 'lucide-react';
import type { MediaItem } from '../types';

interface MediaUploaderProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
}

export default function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    console.log('handleDrop called');
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files.length);
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileInput called');
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files.length, files);
    if (files && files.length > 0) {
      console.log('Calling uploadFiles...');
      uploadFiles(files);
    } else {
      console.log('No files to upload');
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (uploading) {
      console.log('Already uploading, please wait...');
      return;
    }

    setUploading(true);

    try {
      console.log(`Starting upload of ${files.length} file(s)`);

      const uploadPromises = files.map(async (file) => {
        console.log(`Uploading ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed for ${file.name}:`, errorText);
          throw new Error(`Failed to upload ${file.name}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`Successfully uploaded ${file.name}:`, result);

        if (!result.uploads || result.uploads.length === 0) {
          throw new Error(`No upload result for ${file.name}`);
        }

        return result.uploads[0];
      });

      const uploadedMedia = await Promise.all(uploadPromises);

      // Add uploaded media to existing media
      const newMedia = uploadedMedia.map((upload) => ({
        type: upload.type as 'image' | 'video',
        url: upload.url,
      }));

      console.log('All uploads completed, adding to media:', newMedia);
      onChange([...media, ...newMedia]);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    onChange(newMedia);
  };

  const handleUrlAdd = () => {
    const url = prompt('Enter media URL:');
    if (!url) return;

    const type = prompt('Type (image/video):', 'image');
    if (type !== 'image' && type !== 'video') {
      alert('Invalid type. Please enter "image" or "video"');
      return;
    }

    onChange([...media, { type, url }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Media Gallery (Images & Videos)
        </label>
        <button
          type="button"
          onClick={handleUrlAdd}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          + Add URL
        </button>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
          id="media-upload"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-gray-900">Uploading files...</p>
          </div>
        ) : (
          <label htmlFor="media-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-900 mb-2">
              <span className="font-medium text-purple-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-700">Images (PNG, JPG, GIF) or Videos (MP4, WEBM)</p>
          </label>
        )}
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {media.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Video className="w-8 h-8 text-white" />
                    <video
                      src={item.url}
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                      muted
                    />
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {item.type === 'image' ? (
                    <ImageIcon className="w-3 h-3 inline mr-1" />
                  ) : (
                    <Video className="w-3 h-3 inline mr-1" />
                  )}
                  {item.type}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Position Badge */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {media.length === 0 && (
        <p className="text-sm text-gray-900 text-center py-4">
          No media added yet. Upload or add URLs to get started.
        </p>
      )}
    </div>
  );
}
