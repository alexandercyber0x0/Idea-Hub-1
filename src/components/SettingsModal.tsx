'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  X, 
  Download, 
  Upload, 
  Key, 
  Eye, 
  EyeOff, 
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
}

export default function SettingsModal({ isOpen, onClose, password }: SettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change',
          password: currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Export data
  const handleExport = async () => {
    setIsExporting(true);
    setImportMessage(null);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Create download
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `idea-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setImportMessage({ type: 'success', text: 'Backup exported successfully!' });
      } else {
        setImportMessage({ type: 'error', text: data.error || 'Failed to export data' });
      }
    } catch {
      setImportMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setIsExporting(false);
    }
  };

  // Import data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, backup }),
      });

      const data = await res.json();

      if (res.ok) {
        setImportMessage({ 
          type: 'success', 
          text: `Imported ${data.results.ideas.imported} ideas and ${data.results.aiTools.imported} AI tools!` 
        });
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportMessage({ type: 'error', text: data.error || 'Failed to import data' });
      }
    } catch {
      setImportMessage({ type: 'error', text: 'Invalid backup file' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Settings
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="bg-gray-800 border border-gray-700 w-full mb-6">
            <TabsTrigger value="security" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <Download className="w-4 h-4 mr-2" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-0">
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <h3 className="text-white font-medium mb-1">Change Password</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Update your encryption password. You'll need to enter your current password.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-300 text-sm">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full text-gray-400 hover:text-white"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 text-sm">New Password</Label>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 text-sm">Confirm New Password</Label>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>

                  {passwordMessage && (
                    <div className={`flex items-center gap-2 text-sm ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {passwordMessage.text}
                    </div>
                  )}

                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-500/20">
                <h3 className="text-purple-300 font-medium mb-1">Security Info</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Your data is encrypted with AES-256</li>
                  <li>• Encryption keys are derived from your password</li>
                  <li>• Data is stored locally on this device</li>
                  <li>• Export backups are encrypted with your password</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="mt-0">
            <div className="space-y-4">
              {/* Export */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <h3 className="text-white font-medium mb-1">Export Backup</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Download an encrypted backup of all your ideas and AI tools.
                </p>

                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Backup
                    </>
                  )}
                </Button>
              </div>

              {/* Import */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <h3 className="text-white font-medium mb-1">Import Backup</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Restore your data from a backup file. Existing data won't be overwritten.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Backup
                    </>
                  )}
                </Button>
              </div>

              {importMessage && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${importMessage.type === 'success' ? 'text-green-400 bg-green-950/30' : 'text-red-400 bg-red-950/30'}`}>
                  {importMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {importMessage.text}
                </div>
              )}

              <div className="p-4 bg-yellow-950/30 rounded-xl border border-yellow-500/20">
                <h3 className="text-yellow-300 font-medium mb-1">⚠️ Important</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Keep your backup files in a safe place</li>
                  <li>• Backup files contain encrypted data</li>
                  <li>• You'll need your password to restore backups</li>
                  <li>• Regular backups are recommended</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
