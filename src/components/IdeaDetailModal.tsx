'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, FileText, Link as LinkIcon, ExternalLink, Instagram, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Idea } from './IdeaModal';

interface IdeaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onEdit: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function IdeaDetailModal({ isOpen, onClose, idea, onEdit, onArchive, onDelete }: IdeaDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !idea) return null;

  const parseReelLinks = (): string[] => {
    try {
      return idea.reelLinks ? JSON.parse(idea.reelLinks) : [];
    } catch {
      return [];
    }
  };

  const parseSubtasks = (): { id: string; title: string; completed: boolean }[] => {
    try {
      if (!idea.subtasks) return [];
      // Handle if it's already an array or a JSON string
      if (Array.isArray(idea.subtasks)) return idea.subtasks;
      return JSON.parse(idea.subtasks as unknown as string);
    } catch {
      return [];
    }
  };

  const reelLinks = parseReelLinks();
  const subtasks = parseSubtasks();
  const isArchived = idea.status === 'archived';

  const handleArchive = () => {
    onArchive(idea.id);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(idea.id);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{idea.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className="border-purple-500/30 text-purple-300 capitalize">
            {idea.category}
          </Badge>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 capitalize">
            {idea.status}
          </Badge>
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-300 capitalize">
            {idea.priority} priority
          </Badge>
        </div>

        {/* Description */}
        {idea.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-gray-200">{idea.description}</p>
          </div>
        )}

        {/* AI Summary */}
        {idea.summary && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-950/50 to-pink-950/30 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 text-purple-300 mb-3">
              <MessageSquare className="w-4 h-4" />
              <h3 className="text-sm font-medium">AI Summary</h3>
            </div>
            <div className="text-gray-200 whitespace-pre-wrap text-sm">
              {idea.summary}
            </div>
          </div>
        )}

        {/* Raw Transcript */}
        {idea.transcript && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <FileText className="w-4 h-4" />
              <h3 className="text-sm font-medium">Raw Transcript</h3>
            </div>
            <div className="text-gray-300 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
              {idea.transcript}
            </div>
          </div>
        )}

        {/* Instagram Reel Links */}
        {reelLinks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-pink-400 mb-3">
              <Instagram className="w-4 h-4" />
              <h3 className="text-sm font-medium">Instagram Reels</h3>
            </div>
            <div className="space-y-2">
              {reelLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-pink-950/20 rounded-lg border border-pink-500/20 hover:bg-pink-950/30 transition-colors"
                >
                  <LinkIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300 truncate flex-1">{link}</span>
                  <ExternalLink className="w-4 h-4 text-pink-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Subtasks</h3>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div 
                  key={subtask.id}
                  className={`p-3 rounded-lg ${subtask.completed ? 'bg-green-950/30 border border-green-500/20' : 'bg-gray-800 border border-gray-700'}`}
                >
                  <span className={subtask.completed ? 'text-green-300 line-through' : 'text-gray-200'}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Created {new Date(idea.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            <Button 
              onClick={onEdit}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Edit Idea
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
          {!isArchived && (
            <Button 
              onClick={handleArchive}
              variant="outline"
              className="flex-1 border-yellow-600/50 text-yellow-400 hover:bg-yellow-950/30"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          )}
          
          {!showDeleteConfirm ? (
            <Button 
              onClick={handleDeleteClick}
              variant="outline"
              className="flex-1 border-red-600/50 text-red-400 hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              <Button 
                onClick={handleCancelDelete}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirm Delete
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}