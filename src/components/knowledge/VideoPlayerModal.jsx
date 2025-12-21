import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye } from 'lucide-react';

export default function VideoPlayerModal({ isOpen, onClose, video }) {
  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl dark-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">{video.title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {video.description}
          </DialogDescription>
          <div className="flex items-center gap-4 pt-2">
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              <Clock className="w-3 h-3 mr-1" />
              {video.duration}
            </Badge>
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
              <Eye className="w-3 h-3 mr-1" />
              {video.views_count || 0} views
            </Badge>
          </div>
        </DialogHeader>

        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}