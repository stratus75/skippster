import React from 'react';
import { Play } from 'lucide-react';

interface VideoEmbedProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
}

export function VideoEmbed({ videoId, title, thumbnail }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Link to the Tube app video player
  const tubeUrl = `http://localhost:3006/video/${videoId}`;

  return (
    <div className="my-2">
      <a
        href={tubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="aspect-video bg-[#0f0f0f] rounded-lg overflow-hidden relative">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title || 'Video'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-tube-500/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-tube-500" />
              </div>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 bg-tube-500 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>

          {/* Tube badge */}
          <div className="absolute bottom-2 right-2 bg-tube-500 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <Play className="w-3 h-3" />
            Tube
          </div>
        </div>

        {title && (
          <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
            {title}
          </p>
        )}
      </a>
    </div>
  );
}