'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Instagram, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AIToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: { name: string; reelLink?: string; notes?: string }) => void;
  isLoading: boolean;
}

export default function AIToolModal({ isOpen, onClose, onSave, isLoading }: AIToolModalProps) {
  const [name, setName] = useState('');
  const [reelLink, setReelLink] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      reelLink: reelLink.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    
    // Reset form
    setName('');
    setReelLink('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

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
        className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Add AI Tool
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Tool Name */}
          <div>
            <Label htmlFor="toolName" className="text-gray-300">
              AI Tool Name *
            </Label>
            <Input
              id="toolName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ChatGPT, Midjourney, Claude..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 mt-1"
              disabled={isLoading}
            />
          </div>

          {/* Instagram Reel Link */}
          <div>
            <Label htmlFor="reelLink" className="text-gray-300 flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-400" />
              Instagram Reel Link (Optional)
            </Label>
            <Input
              id="reelLink"
              value={reelLink}
              onChange={(e) => setReelLink(e.target.value)}
              placeholder="https://instagram.com/reel/..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 mt-1"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to a reel where you learned about this tool
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-gray-300 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-cyan-400" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any personal notes about this tool..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 mt-1 min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-purple-950/30 rounded-lg border border-purple-500/20">
            <p className="text-xs text-purple-300">
              💡 The AI will automatically search the web for information about this tool, 
              including its website, pricing, features, and use cases.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              'Add Tool'
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
