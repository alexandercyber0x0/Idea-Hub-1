'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ExternalLink, 
  Instagram, 
  Star, 
  Trash2, 
  Globe, 
  DollarSign,
  Tag,
  MoreVertical
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AITool {
  id: string;
  name: string;
  description: string | null;
  reelLink: string | null;
  website: string | null;
  pricing: string | null;
  useCases: string | null;
  features: string | null;
  category: string | null;
  logoUrl: string | null;
  isFavorite: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AIToolCardProps {
  tool: AITool;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export default function AIToolCard({ tool, onDelete, onToggleFavorite }: AIToolCardProps) {
  const parseJson = (jsonStr: string | null): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const useCases = parseJson(tool.useCases);
  const features = parseJson(tool.features);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative bg-gradient-to-br from-purple-950/50 to-pink-950/30 border border-purple-500/20 rounded-xl p-5 backdrop-blur-sm shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{tool.name}</h3>
            {tool.category && (
              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300 mt-1">
                {tool.category}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(tool.id, !tool.isFavorite)}
            className="h-8 w-8 hover:bg-gray-800"
          >
            <Star className={`w-4 h-4 ${tool.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
              <DropdownMenuItem 
                onClick={() => onDelete(tool.id)}
                className="text-red-400 focus:text-red-400 focus:bg-gray-800"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tool
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {tool.description && (
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">{tool.description}</p>
      )}

      {/* Pricing */}
      {tool.pricing && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-green-400">{tool.pricing}</span>
        </div>
      )}

      {/* Use Cases */}
      {useCases.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <Tag className="w-3 h-3" />
            Use Cases
          </div>
          <div className="flex flex-wrap gap-1">
            {useCases.slice(0, 3).map((uc, i) => (
              <Badge key={i} variant="secondary" className="text-xs bg-purple-950/50 text-purple-300 border border-purple-500/20">
                {uc}
              </Badge>
            ))}
            {useCases.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 border border-gray-700">
                +{useCases.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Key Features</div>
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 3).map((f, i) => (
              <Badge key={i} variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/10">
        {tool.website && (
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Globe className="w-3 h-3" />
            Website
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {tool.reelLink && (
          <a
            href={tool.reelLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors"
          >
            <Instagram className="w-3 h-3" />
            Reel
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Notes */}
      {tool.notes && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-gray-400 italic">"{tool.notes}"</p>
        </div>
      )}
    </motion.div>
  );
}
