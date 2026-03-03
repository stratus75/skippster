import React, { useState } from 'react';
import { X, Upload as UploadIcon, Lock, DollarSign, Tag } from 'lucide-react';

interface VideoUploadModalProps {
  onClose: () => void;
  onComplete: (videoId: string) => void;
}

export function VideoUploadModal({ onClose, onComplete }: VideoUploadModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      setFile(files[0]);
      simulateUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      simulateUpload(files[0]);
    }
  };

  const simulateUpload = (videoFile: File) => {
    setStep(2);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setStep(3);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Upload Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3d3d3d] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <UploadArea
              onDrop={handleDrop}
              onFileSelect={handleFileSelect}
              dragActive={dragActive}
              setDragActive={setDragActive}
            />
          )}

          {step === 2 && (
            <UploadingProgress progress={uploadProgress} fileName={file?.name} />
          )}

          {step === 3 && (
            <UploadDetails
              fileName={file?.name}
              onComplete={() => onComplete('video_' + Date.now())}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function UploadArea({
  onDrop,
  onFileSelect,
  dragActive,
  setDragActive,
}: {
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
}) {
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        dragActive ? 'border-tube-500 bg-tube-500/10' : 'border-gray-700 hover:border-gray-600'
      }`}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={handleDrag}
      onDrop={onDrop}
    >
      <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
        <UploadIcon className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium mb-2">Drag and drop video files to upload</h3>
      <p className="text-gray-500 mb-6">Your videos will be private until you publish them.</p>
      <label className="inline-block">
        <input
          type="file"
          accept="video/*"
          onChange={onFileSelect}
          className="hidden"
        />
        <button className="bg-tube-500 hover:bg-tube-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Select Files
        </button>
      </label>
      <div className="mt-6 text-sm text-gray-500">
        <p>By submitting your videos to Skippster, you acknowledge that you agree</p>
        <p>to Skippster's Terms of Service and Community Guidelines.</p>
      </div>
    </div>
  );
}

function UploadingProgress({ progress, fileName }: { progress: number; fileName?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-32 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
          <UploadIcon className="w-8 h-8 text-gray-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium mb-1">{fileName || 'video.mp4'}</p>
          <p className="text-sm text-gray-500 mb-2">Uploading to IPFS...</p>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-tube-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">{progress}%</p>
        </div>
      </div>
      <div className="bg-[#272727] rounded-lg p-4">
        <p className="text-sm text-gray-400">
          Your video is being uploaded to IPFS and will be distributed via WebTorrent.
          This ensures your content stays accessible even if the original server goes down.
        </p>
      </div>
    </div>
  );
}

function UploadDetails({
  fileName,
  onComplete,
  onCancel,
}: {
  fileName?: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(fileName?.replace(/\.[^/.]+$/, '') || '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [monetization, setMonetization] = useState<'free' | 'donations' | 'payperview' | 'subscription'>('free');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'SATS' | 'BTC' | 'SOL' | 'USD'>('USD');

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-48 h-28 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-600">Thumbnail</span>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Title (required)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#272727] rounded-lg px-4 py-3"
            />
          </div>
          <div>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#272727] rounded-lg px-4 py-3 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add a tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="flex-1 bg-[#272727] rounded-lg px-4 py-2"
          />
          <button onClick={addTag} className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] rounded-lg">
            <Tag className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-tube-500/20 text-tube-500 px-3 py-1 rounded-full text-sm"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:bg-tube-500/30 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Monetization */}
      <div>
        <label className="block text-sm font-medium mb-2">Monetization</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: 'free', label: 'Free', icon: null },
            { value: 'donations', label: 'Donations', icon: <DollarSign className="w-4 h-4" /> },
            { value: 'payperview', label: 'Pay Per View', icon: <Lock className="w-4 h-4" /> },
            { value: 'subscription', label: 'Subscription', icon: <Lock className="w-4 h-4" /> },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setMonetization(option.value as any)}
              className={`p-3 rounded-lg text-left transition-colors ${
                monetization === option.value
                  ? 'bg-tube-500 text-white'
                  : 'bg-[#272727] hover:bg-[#3d3d3d]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Price (for payperview) */}
      {(monetization === 'payperview' || monetization === 'subscription') && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#272727] rounded-lg px-4 py-3"
            />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-[#272727] rounded-lg px-4 py-3"
          >
            <option value="USD">USD</option>
            <option value="SATS">SATS</option>
            <option value="BTC">BTC</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-[#272727] hover:bg-[#3d3d3d] rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-tube-500 hover:bg-tube-600 text-white rounded-lg font-medium transition-colors"
        >
          Upload
        </button>
      </div>
    </div>
  );
}