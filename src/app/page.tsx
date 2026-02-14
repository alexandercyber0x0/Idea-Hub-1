'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Lightbulb, 
  Sparkles, 
  Plus, 
  Loader2,
  Archive,
  Brain,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import IdeaCard from '@/components/IdeaCard';
import IdeaModal, { Idea } from '@/components/IdeaModal';
import IdeaDetailModal from '@/components/IdeaDetailModal';
import AIToolCard from '@/components/AIToolCard';
import AIToolModal from '@/components/AIToolModal';
import PasswordSetupModal from '@/components/PasswordSetupModal';
import PasswordUnlockModal from '@/components/PasswordUnlockModal';
import SettingsModal from '@/components/SettingsModal';

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

export default function IdeaHub() {
  // Auth state
  const [isPasswordSetup, setIsPasswordSetup] = useState<boolean | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Data state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [aiTools, setAITools] = useState<AITool[]>([]);
  const [activeTab, setActiveTab] = useState('ideas');
  const [isLoading, setIsLoading] = useState(true);
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [draggedIdea, setDraggedIdea] = useState<Idea | null>(null);
  const [isAIToolModalOpen, setIsAIToolModalOpen] = useState(false);
  const [isAddingAITool, setIsAddingAITool] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Check password setup status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        setIsPasswordSetup(data.isSetup);
        
        if (!data.isSetup) {
          setIsLoading(false);
        }
      } catch {
        setIsPasswordSetup(false);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch data when unlocked
  const fetchData = useCallback(async () => {
    if (!isUnlocked || !password) return;
    
    setIsLoading(true);
    try {
      const headers = { 'x-encryption-key': password };
      
      const [ideasRes, toolsRes] = await Promise.all([
        fetch('/api/ideas', { headers }),
        fetch('/api/ai-tools', { headers }),
      ]);
      
      const ideasData = await ideasRes.json();
      const toolsData = await toolsRes.json();
      
      if (ideasRes.ok) setIdeas(ideasData);
      if (toolsRes.ok) setAITools(toolsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isUnlocked, password, toast]);

  useEffect(() => {
    if (isUnlocked) {
      fetchData();
    }
  }, [isUnlocked, fetchData]);

  const handlePasswordSetup = (newPassword: string) => {
  setPassword(newPassword);
  setIsPasswordSetup(true);  // ← ADD THIS LINE
  setIsUnlocked(true);
  sessionStorage.setItem('ideaHubPassword', newPassword);
  toast({
    title: 'Welcome!',
    description: 'Your data is now encrypted and secure',
  });
};

  // Handle unlock
  const handleUnlock = (unlockPassword: string) => {
    setPassword(unlockPassword);
    setIsUnlocked(true);
    sessionStorage.setItem('ideaHubPassword', unlockPassword);
  };

  // Restore password from session storage on mount
  useEffect(() => {
    if (isPasswordSetup === true) {
      const storedPassword = sessionStorage.getItem('ideaHubPassword');
      if (storedPassword) {
        // Verify the stored password is still valid
        fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', password: storedPassword }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              setPassword(storedPassword);
              setIsUnlocked(true);
            }
          })
          .catch(() => {
            // Password verification failed, show unlock modal
          });
      }
    }
  }, [isPasswordSetup]);

  // API helper with password
  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-encryption-key': password,
      },
    });
  }, [password]);

  // Idea handlers
  const handleSaveIdea = async (ideaData: Partial<Idea>) => {
    try {
      if (ideaData.id) {
        const res = await apiCall(`/api/ideas/${ideaData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ideaData),
        });
        const updated = await res.json();
        setIdeas(ideas.map(i => i.id === updated.id ? updated : i));
        toast({ title: 'Success', description: 'Idea updated' });
      } else {
        const res = await apiCall('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ideaData),
        });
        const newIdea = await res.json();
        setIdeas([newIdea, ...ideas]);
        toast({ title: 'Success', description: 'Idea created' });
      }
    } catch (error) {
      console.error('Failed to save idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to save idea',
        variant: 'destructive',
      });
    }
  };

  // AI Tool handlers
  const handleAddAITool = async (toolData: { name: string; reelLink?: string; notes?: string }) => {
    setIsAddingAITool(true);
    
    try {
      const res = await apiCall('/api/ai-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolData),
      });
      
      const newTool = await res.json();
      
      if (!res.ok) {
        throw new Error(newTool.error || 'Failed to add AI tool');
      }
      
      setAITools([newTool, ...aiTools]);
      toast({
        title: 'AI Tool Added',
        description: `${newTool.name} has been added with web search data`,
      });
    } catch (error) {
      console.error('Failed to add AI tool:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add AI tool',
        variant: 'destructive',
      });
    } finally {
      setIsAddingAITool(false);
    }
  };

  const handleDeleteAITool = async (id: string) => {
    try {
      await apiCall(`/api/ai-tools/${id}`, { method: 'DELETE' });
      setAITools(aiTools.filter(t => t.id !== id));
      toast({ title: 'Success', description: 'AI Tool deleted' });
    } catch (error) {
      console.error('Failed to delete AI tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete AI tool',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await apiCall(`/api/ai-tools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite }),
      });
      setAITools(aiTools.map(t => t.id === id ? { ...t, isFavorite } : t));
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  // Drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idea = ideas.find(i => i.id === active.id);
    if (idea) {
      setDraggedIdea(idea);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedIdea(null);
    
    if (!over) return;
    
    const idea = ideas.find(i => i.id === active.id);
    if (!idea) return;
    
    const columnId = over.id as string;
    if (['bank', 'doing', 'done', 'archived'].includes(columnId)) {
      if (idea.status !== columnId) {
        handleSaveIdea({ ...idea, status: columnId });
      }
    }
  };

  // Filter ideas by status
  const bankIdeas = ideas.filter(i => i.status === 'bank');
  const doingIdeas = ideas.filter(i => i.status === 'doing');
  const doneIdeas = ideas.filter(i => i.status === 'done');
  const archivedIdeas = ideas.filter(i => i.status === 'archived');

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setIsDetailModalOpen(false);
    setIsIdeaModalOpen(true);
  };

  // Column component
  const Column = ({ title, status, ideas: columnIdeas, icon: Icon, color }: {
    title: string;
    status: string;
    ideas: Idea[];
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="flex-1 min-w-[280px] bg-gray-900/50 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
        <Badge variant="outline" className="ml-auto border-gray-700 text-gray-400">
          {columnIdeas.length}
        </Badge>
      </div>
      <SortableContext items={columnIdeas.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]" id={status}>
          <AnimatePresence>
            {columnIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => {
                  setActiveIdea(idea);
                  setIsDetailModalOpen(true);
                }}
              />
            ))}
          </AnimatePresence>
          {columnIdeas.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No ideas yet
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );

  // Loading state while checking auth
  if (isPasswordSetup === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <p className="text-gray-400">Initializing security...</p>
        </div>
      </div>
    );
  }

  // Show password setup modal for new users
  if (isPasswordSetup === false) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <PasswordSetupModal
          isOpen={true}
          onComplete={handlePasswordSetup}
        />
      </>
    );
  }

  // Show unlock modal if password is set but not unlocked
  if (isPasswordSetup === true && !isUnlocked) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <PasswordUnlockModal
          isOpen={true}
          onUnlock={handleUnlock}
        />
      </>
    );
  }

  // Main loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading your ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Idea Hub</h1>
                <p className="text-xs text-gray-400">Secure • Encrypted • Local</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => {
                  setEditingIdea(null);
                  setIsIdeaModalOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Idea
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900/50 border border-gray-800 mb-6">
            <TabsTrigger value="ideas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideas
              <Badge variant="outline" className="ml-2 border-purple-500/30 text-purple-400">
                {ideas.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-gray-400">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Tools
              <Badge variant="outline" className="ml-2 border-pink-500/30 text-pink-400">
                {aiTools.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-400">
              <Archive className="w-4 h-4 mr-2" />
              Archive
              <Badge variant="outline" className="ml-2 border-gray-500/30 text-gray-400">
                {archivedIdeas.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Ideas Tab */}
          <TabsContent value="ideas" className="mt-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                <Column
                  title="Idea Bank"
                  status="bank"
                  ideas={bankIdeas}
                  icon={Lightbulb}
                  color="bg-yellow-600"
                />
                <Column
                  title="In Progress"
                  status="doing"
                  ideas={doingIdeas}
                  icon={Brain}
                  color="bg-blue-600"
                />
                <Column
                  title="Done"
                  status="done"
                  ideas={doneIdeas}
                  icon={Lightbulb}
                  color="bg-green-600"
                />
              </div>
              
              <DragOverlay>
                {draggedIdea && (
                  <IdeaCard idea={draggedIdea} onClick={() => {}} isDragging />
                )}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools" className="mt-0">
            <div className="mb-6">
              <Button
                onClick={() => setIsAIToolModalOpen(true)}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add AI Tool
              </Button>
            </div>
            
            {aiTools.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No AI Tools Yet</h3>
                <p className="text-gray-500 mb-6">Add AI tools you discover to keep track of them</p>
                <Button
                  onClick={() => setIsAIToolModalOpen(true)}
                  className="bg-gradient-to-r from-pink-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First AI Tool
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiTools.filter(t => t.isFavorite).map((tool) => (
                  <AIToolCard
                    key={tool.id}
                    tool={tool}
                    onDelete={handleDeleteAITool}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
                {aiTools.filter(t => !t.isFavorite).map((tool) => (
                  <AIToolCard
                    key={tool.id}
                    tool={tool}
                    onDelete={handleDeleteAITool}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archived" className="mt-0">
            {archivedIdeas.length === 0 ? (
              <div className="text-center py-16">
                <Archive className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Archive is Empty</h3>
                <p className="text-gray-500">Archived ideas will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onClick={() => {
                      setActiveIdea(idea);
                      setIsDetailModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Idea Hub • AES-256 Encrypted</p>
            <p>{ideas.length} ideas • {aiTools.length} AI tools</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <IdeaModal
        isOpen={isIdeaModalOpen}
        onClose={() => {
          setIsIdeaModalOpen(false);
          setEditingIdea(null);
        }}
        onSave={handleSaveIdea}
        idea={editingIdea}
      />

      <IdeaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveIdea(null);
        }}
        idea={activeIdea}
        onEdit={() => activeIdea && handleEditIdea(activeIdea)}
      />

      <AIToolModal
        isOpen={isAIToolModalOpen}
        onClose={() => setIsAIToolModalOpen(false)}
        onSave={handleAddAITool}
        isLoading={isAddingAITool}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        password={password}
      />
    </div>
  );
}
