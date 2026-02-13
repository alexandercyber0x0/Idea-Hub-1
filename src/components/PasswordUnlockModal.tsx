'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordUnlockModalProps {
  isOpen: boolean;
  onUnlock: (password: string) => void;
  error?: string;
}

export default function PasswordUnlockModal({ isOpen, onUnlock, error }: PasswordUnlockModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleUnlock = async () => {
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setLocalError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', password }),
      });

      const data = await res.json();

      if (data.valid) {
        onUnlock(password);
      } else {
        setLocalError('Incorrect password');
      }
    } catch {
      setLocalError('Failed to verify password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          Unlock Your Data
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter your password to decrypt and access your ideas
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-gray-800 border-gray-700 text-white pr-10"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {(localError || error) && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {localError || error}
            </div>
          )}

          <Button
            onClick={handleUnlock}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your data is encrypted and stored locally
        </p>
      </motion.div>
    </motion.div>
  );
}
