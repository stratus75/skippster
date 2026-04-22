/**
 * UploadPage - End-to-end video upload page
 * Handles file selection, transcoding progress, IPFS upload, and torrent seeding
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, X, FileVideo, CheckCircle, AlertCircle, 
  Loader2, ArrowLeft, Lock, DollarSign, Tag, 
  Cloud, HardDrive, Share2
} from 'lucide-react';

// Types for upload state
interface UploadProgress {
  stage: 'idle' | 'selecting' | 'transcoding' | 'uploading-ipfs' | 'seeding' | 'complete' | 'error';
  progress: number;
  message: string;
  ipfsCid?: string;
  magnetUri?: string;
  infoHash?: string;
  videoId?: string;
  error?: string;
}

interface VideoDetails {
  title: string;
  description: string;
  tags: string[];
  monetizationType: 'free' | 'donations' | 'payperview' | 'subscription';
  price?: number;
  currency?: 'USD' | 'SATS' | 'BTC' | 'SOL';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [details, setDetails] = useState<VideoDetails>({
    title: '',
    description: '',
    tags: [],
    monetizationType: 'free',
    price: undefined,
    currency: 'USD',
  });
  const [tagInput, setTagInput] = useState('');

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: 'Please select a video file',
          error: 'Invalid file type',
        });
        return;
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB)`,
          error: 'File too large',
        });
        return;
      }

      setFile(selectedFile);
      setDetails(prev => ({
        ...prev,
        title: prev.title || selectedFile.name.replace(/\.[^/.]+$/, ''),
      }));
      
      // Start upload flow
      startUploadFlow(selectedFile);
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        setDetails(prev => ({
          ...prev,
          title: prev.title || droppedFile.name.replace(/\.[^/.]+$/, ''),
        }));
        startUploadFlow(droppedFile);
      }
    }
  }, []);

  // Main upload flow
  const startUploadFlow = async (videoFile: File) => {
    try {
      // Stage 1: Transcoding (simulated)
      setUploadProgress({
        stage: 'transcoding',
        progress: 0,
        message: 'Preparing video for upload...',
      });

      // Simulate transcoding progress
      await simulateProgress(setUploadProgress, 'transcoding', 10000, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          progress,
          message: `Transcoding: ${progress}% complete`,
        }));
      });
      // Stage 2: Upload to IPFS
      setUploadProgress({
        stage: 'uploading-ipfs',
        progress: 0,
        message: 'Uploading to IPFS...',
      });

      // Convert file to base64 for upload
      const videoArrayBuffer = await videoFile.arrayBuffer();
      const videoBase64 = btoa(
        new Uint8Array(videoArrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Simulate IPFS upload progress
      await simulateProgress(setUploadProgress, 'uploading-ipfs', 8000, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          progress: progress,
          message: `Uploading to IPFS: ${progress}%`,
        }));
      });

      // Prepare form data as JSON
      const uploadPayload = {
        videoData: videoBase64,
        filename: videoFile.name,
        fileSize: videoFile.size,
        title: details.title || videoFile.name,
        description: details.description,
        tags: JSON.stringify(details.tags),
        monetizationType: details.monetizationType,
        price: details.price?.toString(),
        currency: details.currency,
      };

      // Upload to server (which handles IPFS + Torrent)
      const response = await fetch(`${import.meta.env.VITE_PDS_URL || 'http://localhost:4000'}/api/videos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadPayload),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Stage 3: Seeding
      setUploadProgress({
        stage: 'seeding',
        progress: 80,
        message: 'Starting P2P seeding...',
        ipfsCid: result.cid,
        magnetUri: result.magnetUri,
        infoHash: result.infoHash,
      });

      // Wait for seeding to start
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Complete
      setUploadProgress({
        stage: 'complete',
        progress: 100,
        message: 'Upload complete! Your video is now live.',
        ipfsCid: result.cid,
        magnetUri: result.magnetUri,
        infoHash: result.infoHash,
        videoId: result.id,
      });

    } catch (error: any) {
      console.error('[UploadPage] Upload error:', error);
      setUploadProgress({
        stage: 'error',
        progress: 0,
        message: error.message || 'Upload failed',
        error: error.message,
      });
    }
  };

  // Simulate progress for stages that don't have real progress
  const simulateProgress = (
    setter: React.Dispatch<React.SetStateAction<UploadProgress>>,
    targetStage: UploadProgress['stage'],
    durationMs: number,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
        onProgress?.(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  // Add tag
  const addTag = () => {
    if (tagInput && !details.tags.includes(tagInput)) {
      setDetails(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setDetails(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!file || !details.title.trim()) return;

    // If already uploaded, just save metadata
    if (uploadProgress.stage === 'complete' && uploadProgress.videoId) {
      // Video already processed, redirect to watch page
      navigate(`/watch/${uploadProgress.videoId}`);
      return;
    }

    // Otherwise start the flow
    startUploadFlow(file);
  };

  // Render based on stage
  const renderContent = () => {
    switch (uploadProgress.stage) {
      case 'idle':
        return renderIdleState();
      case 'selecting':
      case 'transcoding':
      case 'uploading-ipfs':
      case 'seeding':
        return renderUploadingState();
      case 'complete':
        return renderCompleteState();
      case 'error':
        return renderErrorState();
      default:
        return renderIdleState();
    }
  };

  const renderIdleState = () => (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-tube-500 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDragLeave={() => {}}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Upload className="w-10 h-10 text-gray-500" />
        </div>
        
        <h3 className="text-lg font-medium mb-2">
          Drag and drop video files to upload
        </h3>
        <p className="text-gray-500 mb-6">
          Or click to select a file from your computer
        </p>
        
        <button className="bg-tube-500 hover:bg-tube-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Select Files
        </button>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Supported formats: MP4, WebM, MOV, AVI</p>
          <p>Maximum file size: 10GB</p>
        </div>
      </div>

      {/* Video details form */}
      {file && (
        <div className="bg-[#1f1f1f] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-32 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
              <FileVideo className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setUploadProgress({ stage: 'idle', progress: 0, message: '' });
              }}
              className="ml-auto p-2 hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Title (required)"
            value={details.title}
            onChange={(e) => setDetails(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-[#272727] rounded-lg px-4 py-3"
          />

          <textarea
            placeholder="Description"
            value={details.description}
            onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full bg-[#272727] rounded-lg px-4 py-3 resize-none"
          />

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
              <button
                onClick={addTag}
                className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] rounded-lg"
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {details.tags.map((tag) => (
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
                  onClick={() => setDetails(prev => ({ 
                    ...prev, 
                    monetizationType: option.value as VideoDetails['monetizationType'] 
                  }))}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    details.monetizationType === option.value
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

          {/* Price (for payperview/subscription) */}
          {(details.monetizationType === 'payperview' || details.monetizationType === 'subscription') && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Price"
                  value={details.price || ''}
                  onChange={(e) => setDetails(prev => ({ 
                    ...prev, 
                    price: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="w-full bg-[#272727] rounded-lg px-4 py-3"
                />
              </div>
              <select
                value={details.currency}
                onChange={(e) => setDetails(prev => ({ 
                  ...prev, 
                  currency: e.target.value as VideoDetails['currency'] 
                }))}
                className="bg-[#272727] rounded-lg px-4 py-3"
              >
                <option value="USD">USD</option>
                <option value="SATS">SATS</option>
                <option value="BTC">BTC</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!details.title.trim()}
            className="w-full bg-tube-500 hover:bg-tube-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            Upload Video
          </button>
        </div>
      )}
    </div>
  );

  const renderUploadingState = () => (
    <div className="space-y-6">
      {/* Progress card */}
      <div className="bg-[#1f1f1f] rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-32 h-20 bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
            {file && <span className="text-gray-600 text-sm">{file.name.slice(-8)}</span>}
            <div 
              className="absolute inset-0 bg-tube-500/30 transition-all"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">{file?.name || 'video.mp4'}</p>
            <p className="text-sm text-gray-500 mb-2">{uploadProgress.message}</p>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-tube-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">{uploadProgress.progress}%</p>
          </div>
        </div>

        {/* Stage indicators */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'transcoding', label: 'Transcoding', icon: Loader2 },
            { key: 'uploading-ipfs', label: 'IPFS Upload', icon: Cloud },
            { key: 'seeding', label: 'P2P Seeding', icon: Share2 },
            { key: 'complete', label: 'Complete', icon: CheckCircle },
          ].map((stage, index) => {
            const stageIndex = ['transcoding', 'uploading-ipfs', 'seeding', 'complete'].indexOf(uploadProgress.stage);
            const isActive = index <= stageIndex;
            const isCurrent = stage.key === uploadProgress.stage;
            const Icon = stage.icon;
            
            return (
              <div
                key={stage.key}
                className={`p-3 rounded-lg text-center ${
                  isActive ? 'bg-tube-500/20 text-tube-500' : 'bg-gray-800 text-gray-500'
                } ${isCurrent ? 'ring-2 ring-tube-500' : ''}`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isCurrent ? 'animate-spin' : ''}`} />
                <span className="text-xs">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-5 h-5 text-tube-500" />
            <span className="font-medium">IPFS Storage</span>
          </div>
          <p className="text-sm text-gray-500">
            Your video is being uploaded to IPFS for decentralized storage.
          </p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-tube-500" />
            <span className="font-medium">P2P Distribution</span>
          </div>
          <p className="text-sm text-gray-500">
            Your video will be seeded via WebTorrent for peer-to-peer sharing.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCompleteState = () => (
    <div className="space-y-6">
      {/* Success card */}
      <div className="bg-[#1f1f1f] rounded-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">Upload Complete!</h3>
        <p className="text-gray-500 mb-6">
          Your video is now live and being distributed via P2P.
        </p>

        {/* Video info */}
        {file && (
          <div className="bg-[#272727] rounded-lg p-4 mb-6 text-left">
            <p className="font-medium mb-2">{details.title || file.name}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="block text-gray-600">Size</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="block text-gray-600">Status</span>
                <span className="text-green-500">Seeding</span>
              </div>
            </div>
          </div>
        )}

        {/* IPFS and Torrent info */}
        {(uploadProgress.ipfsCid || uploadProgress.magnetUri) && (
          <div className="bg-[#272727] rounded-lg p-4 mb-6 text-left space-y-3">
            {uploadProgress.ipfsCid && (
              <div>
                <span className="block text-gray-600 text-sm mb-1">IPFS CID</span>
                <code className="text-xs break-all text-tube-500">{uploadProgress.ipfsCid}</code>
              </div>
            )}
            {uploadProgress.infoHash && (
              <div>
                <span className="block text-gray-600 text-sm mb-1">Info Hash</span>
                <code className="text-xs break-all text-tube-500">{uploadProgress.infoHash}</code>
              </div>
            )}
            {uploadProgress.magnetUri && (
              <div>
                <span className="block text-gray-600 text-sm mb-1">Magnet URI</span>
                <code className="text-xs break-all text-gray-400">{uploadProgress.magnetUri.slice(0, 60)}...</code>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/watch/${uploadProgress.videoId}`)}
            className="flex items-center gap-2 bg-tube-500 hover:bg-tube-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <FileVideo className="w-5 h-5" />
            Watch Video
          </button>
          <button
            onClick={() => {
              setFile(null);
              setUploadProgress({ stage: 'idle', progress: 0, message: '' });
              setDetails({
                title: '',
                description: '',
                tags: [],
                monetizationType: 'free',
              });
            }}
            className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Another
          </button>
        </div>
      </div>

      {/* Distribution info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-5 h-5 text-tube-500" />
            <span className="font-medium">Storage</span>
          </div>
          <p className="text-sm text-gray-500">
            Your video is pinned on IPFS and will persist as long as you seed it.
          </p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-tube-500" />
            <span className="font-medium">Sharing</span>
          </div>
          <p className="text-sm text-gray-500">
            Other peers can now download your video through the BitTorrent network.
          </p>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-6">
      <div className="bg-[#1f1f1f] rounded-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">Upload Failed</h3>
        <p className="text-gray-500 mb-6">
          {uploadProgress.message || 'An error occurred during upload'}
        </p>

        <div className="bg-[#272727] rounded-lg p-4 mb-6">
          <code className="text-sm text-red-400">{uploadProgress.error}</code>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setFile(null);
              setUploadProgress({ stage: 'idle', progress: 0, message: '' });
            }}
            className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Upload Video</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {renderContent()}
    </div>
  );
}

export default UploadPage;
