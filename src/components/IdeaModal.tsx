'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Plus, 
  Link as LinkIcon, 
  Trash2,
  Lightbulb,
  DollarSign,
  Briefcase,
  Dumbbell,
  Code,
  Folder,
  Mic,
  Square,
  Loader2,
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  color: string | null;
  transcript: string | null;
  summary: string | null;
  reelLinks: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: { id: string; title: string; completed: boolean }[];
}

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Partial<Idea>) => void;
  idea?: Idea | null;
}

const categories = [
  { value: 'trading', label: 'Trading', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'money making', label: 'Money Making', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'projects', label: 'Projects', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'gym', label: 'Gym', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'tech', label: 'Tech', icon: <Code className="w-4 h-4" /> },
  { value: 'other', label: 'Other', icon: <Folder className="w-4 h-4" /> },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
];

const statuses = [
  { value: 'bank', label: 'Idea Bank' },
  { value: 'doing', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

// Chunk duration in seconds (under 30s ASR limit)
const CHUNK_DURATION = 25;

function IdeaModalInner({ onClose, onSave, idea }: Omit<IdeaModalProps, 'isOpen'>) {
  const { toast } = useToast();
  
  // Parse initial values from idea prop
  const initialValues = useMemo(() => {
    if (idea) {
      let parsedReelLinks: string[] = [];
      try {
        parsedReelLinks = idea.reelLinks ? JSON.parse(idea.reelLinks) : [];
      } catch {
        parsedReelLinks = [];
      }
      return {
        title: idea.title,
        description: idea.description || '',
        category: idea.category,
        status: idea.status,
        priority: idea.priority,
        reelLinks: parsedReelLinks,
        transcript: idea.transcript || '',
        summary: idea.summary || '',
      };
    }
    return {
      title: '',
      description: '',
      category: 'other',
      status: 'bank',
      priority: 'medium',
      reelLinks: [],
      transcript: '',
      summary: '',
    };
  }, [idea]);

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [category, setCategory] = useState(initialValues.category);
  const [status, setStatus] = useState(initialValues.status);
  const [priority, setPriority] = useState(initialValues.priority);
  const [reelLinks, setReelLinks] = useState<string[]>(initialValues.reelLinks);
  const [newReelLink, setNewReelLink] = useState('');
  const [transcript, setTranscript] = useState(initialValues.transcript);
  const [summary, setSummary] = useState(initialValues.summary);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Refs for voice recording
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const createRecorderRef = useRef<() => void>(() => {});

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    isRecordingRef.current = false;
  }, []);

  // Convert blob to base64
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Process a single chunk
  const processChunk = useCallback(async (blob: Blob) => {
    try {
      const base64 = await blobToBase64(blob);
      chunksRef.current.push(base64);
      setChunkCount(prev => prev + 1);
    } catch (err) {
      console.error('Error processing chunk:', err);
    }
  }, [blobToBase64]);

  // Setup recorder function in ref
  useEffect(() => {
    createRecorderRef.current = async () => {
      if (!streamRef.current || !isRecordingRef.current) return;

      try {
        const recorder = new MediaRecorder(streamRef.current, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const currentChunkBlob: Blob[] = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            currentChunkBlob.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (currentChunkBlob.length > 0) {
            const blob = new Blob(currentChunkBlob, { type: 'audio/webm' });
            await processChunk(blob);
          }
          
          if (isRecordingRef.current) {
            createRecorderRef.current();
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        chunkTimerRef.current = setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, CHUNK_DURATION * 1000);
        
      } catch (err) {
        console.error('Error starting new chunk:', err);
        setRecordingError('Failed to start recording chunk');
      }
    };
  }, [processChunk]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      chunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);
      setChunkCount(0);
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 100);
      
      createRecorderRef.current();
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setRecordingError('Could not access microphone. Please allow microphone access.');
      cleanup();
    }
  }, [cleanup]);

  // Stop recording and process
  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorderRef.current!;
        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            const blob = new Blob([e.data], { type: 'audio/webm' });
            await processChunk(blob);
          }
          resolve();
        };
        recorder.stop();
      });
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Process all chunks
    if (chunksRef.current.length > 0) {
      setIsProcessing(true);
      try {
        // Transcribe
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioChunks: chunksRef.current }),
        });
        
        const transcribeData = await transcribeRes.json();
        
        if (!transcribeRes.ok) {
          throw new Error(transcribeData.error || 'Transcription failed');
        }
        
        const transcriptText = transcribeData.transcription;
        setTranscript(transcriptText);
        
        // Summarize
        const summarizeRes = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: transcriptText, title: title || 'Voice Note' }),
        });
        
        const summarizeData = await summarizeRes.json();
        
        if (summarizeRes.ok && summarizeData.summary) {
          setSummary(summarizeData.summary);
        }
        
        toast({
          title: 'Voice Processed',
          description: `Transcribed ${transcribeData.chunksProcessed} chunks (${totalDuration}s)`,
        });
        
      } catch (error) {
        console.error('Voice processing error:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Voice processing failed',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    }
    
    setRecordingTime(0);
    setChunkCount(0);
  }, [processChunk, title, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleAddReelLink = () => {
    if (newReelLink.trim()) {
      if (newReelLink.includes('instagram.com')) {
        setReelLinks([...reelLinks, newReelLink.trim()]);
        setNewReelLink('');
      }
    }
  };

  const handleRemoveReelLink = (index: number) => {
    setReelLinks(reelLinks.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      id: idea?.id,
      title,
      description: description || null,
      category,
      status,
      priority,
      reelLinks: JSON.stringify(reelLinks),
      transcript: transcript || null,
      summary: summary || null,
    });
    
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            {idea ? 'Edit Idea' : 'New Idea'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-gray-300">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter idea title..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 mt-1 min-h-[80px]"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        {cat.icon}
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-300">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-white hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-gray-300">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-white hover:bg-gray-700">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instagram Reel Links */}
          <div>
            <Label className="text-gray-300 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-pink-400" />
              Instagram Reel Links
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newReelLink}
                onChange={(e) => setNewReelLink(e.target.value)}
                placeholder="https://instagram.com/reel/..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddReelLink()}
              />
              <Button 
                onClick={handleAddReelLink}
                variant="outline"
                className="border-pink-500/50 text-pink-400 hover:bg-pink-950/30"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {reelLinks.length > 0 && (
              <div className="mt-2 space-y-2">
                {reelLinks.map((link, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-gray-800 rounded-lg p-2"
                  >
                    <LinkIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-gray-300 truncate flex-1 hover:text-pink-400"
                    >
                      {link}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveReelLink(index)}
                      className="h-6 w-6 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice Recording Section */}
          <div className="pt-4 border-t border-gray-700">
            <Label className="text-gray-300 flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-purple-400" />
              Voice Recording
            </Label>
            
            {recordingError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 px-4 py-2 rounded-lg mb-3">
                <AlertCircle className="w-4 h-4" />
                {recordingError}
              </div>
            )}

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex flex-col items-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full w-14 h-14 shadow-lg shadow-purple-500/30"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 shadow-lg shadow-red-500/30 animate-pulse"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3 text-white">
                      <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                      <span className="text-xs text-purple-400 bg-purple-950/50 px-2 py-1 rounded">
                        Chunk {chunkCount + 1}
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  {isRecording 
                    ? `Recording splits every ${CHUNK_DURATION}s for processing`
                    : 'Record a voice note to transcribe and summarize your idea'
                  }
                </p>
              </div>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
                  <FileText className="w-4 h-4" />
                  Transcript
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{transcript}</p>
              </div>
            )}

            {/* AI Summary */}
            {summary && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-950/50 to-pink-950/30 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
                  <MessageSquare className="w-4 h-4" />
                  AI Summary
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-800">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {idea ? 'Update' : 'Create'} Idea
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function IdeaModal({ isOpen, onClose, onSave, idea }: IdeaModalProps) {
  if (!isOpen) return null;
  
  const modalKey = idea?.id || 'new';
  
  return (
    <IdeaModalInner
      key={modalKey}
      onClose={onClose}
      onSave={onSave}
      idea={idea}
    />
  );
}
