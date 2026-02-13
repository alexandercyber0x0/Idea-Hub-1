'use client';

import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Briefcase, 
  Dumbbell, 
  DollarSign, 
  Code, 
  Folder,
  Clock,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  MessageSquare,
  Link as LinkIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Idea } from './IdeaModal';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
  isDragging?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  trading: <DollarSign className="w-4 h-4" />,
  'money making': <DollarSign className="w-4 h-4" />,
  projects: <Briefcase className="w-4 h-4" />,
  gym: <Dumbbell className="w-4 h-4" />,
  tech: <Code className="w-4 h-4" />,
  other: <Folder className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  trading: 'from-green-600/20 to-emerald-600/20 border-green-500/30',
  'money making': 'from-yellow-600/20 to-amber-600/20 border-yellow-500/30',
  projects: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30',
  gym: 'from-orange-600/20 to-red-600/20 border-orange-500/30',
  tech: 'from-cyan-600/20 to-teal-600/20 border-cyan-500/30',
  other: 'from-gray-600/20 to-slate-600/20 border-gray-500/30',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export default function IdeaCard({ idea, onClick, isDragging }: IdeaCardProps) {
  const parseReelLinks = (): string[] => {
    try {
      return idea.reelLinks ? JSON.parse(idea.reelLinks) : [];
    } catch {
      return [];
    }
  };

  const reelLinks = parseReelLinks();
  const hasReels = reelLinks.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: isDragging ? 1.02 : 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative bg-gradient-to-br ${categoryColors[idea.category] || categoryColors.other}
        border rounded-xl p-4 cursor-pointer
        backdrop-blur-sm shadow-lg hover:shadow-xl
        transition-all duration-300
      `}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 right-2 opacity-30">
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-white/10 rounded-lg">
          {categoryIcons[idea.category] || categoryIcons.other}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{idea.title}</h3>
          {idea.description && (
            <p className="text-sm text-gray-400 truncate mt-1">{idea.description}</p>
          )}
        </div>
      </div>

      {/* AI Summary Preview */}
      {idea.summary && (
        <div className="mb-3 p-2 bg-purple-950/30 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-1 text-purple-300 text-xs mb-1">
            <MessageSquare className="w-3 h-3" />
            AI Summary
          </div>
          <p className="text-xs text-gray-300 line-clamp-2">{idea.summary}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Priority Indicator */}
          <div className={`w-2 h-2 rounded-full ${priorityColors[idea.priority]}`} />
          
          {/* Status Badge */}
          <Badge 
            variant="outline" 
            className="text-xs border-white/20 text-gray-300"
          >
            {idea.status === 'bank' && <Clock className="w-3 h-3 mr-1" />}
            {idea.status === 'doing' && <AlertCircle className="w-3 h-3 mr-1" />}
            {idea.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {idea.status}
          </Badge>

          {/* Reel Links Indicator */}
          {hasReels && (
            <Badge 
              variant="outline" 
              className="text-xs border-pink-500/30 text-pink-300"
            >
              <LinkIcon className="w-3 h-3 mr-1" />
              {reelLinks.length} reel{reelLinks.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        <Badge 
          variant="outline" 
          className="text-xs border-white/10 text-gray-400 capitalize"
        >
          {idea.category}
        </Badge>
      </div>
    </motion.div>
  );
}
