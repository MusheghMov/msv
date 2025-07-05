'use client';

import { useCallback } from 'react';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { AlertCircle, Code2, CheckCircle, XCircle } from 'lucide-react';
import { useMangaScript } from '@/app/hooks/useMangaScript';

export function ScriptEditor() {
  const { 
    scriptText, 
    setScriptText, 
    errors, 
    isValid, 
    v2ParsedScript 
  } = useMangaScript();

  const handleScriptChange = (value: string) => {
    setScriptText(value);
  };

  const handleFormatScript = () => {
    // Basic formatting: normalize line endings and remove extra whitespace
    const formatted = scriptText
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // Replace multiple empty lines with double newline
    
    setScriptText(formatted);
  };

  const getStatusBadge = () => {
    if (!v2ParsedScript) {
      return <Badge variant="secondary">Parsing...</Badge>;
    }
    
    const errorCount = v2ParsedScript.errors.filter(err => err.severity === 'error').length;
    const warningCount = v2ParsedScript.errors.filter(err => err.severity === 'warning').length;
    
    if (errorCount > 0) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{errorCount} Error{errorCount !== 1 ? 's' : ''}</Badge>;
    }
    
    if (warningCount > 0) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />{warningCount} Warning{warningCount !== 1 ? 's' : ''}</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
  };

  const getMetadataDisplay = () => {
    if (!v2ParsedScript?.metadata) return null;
    
    const { totalChapters, totalScenes, totalDialogues } = v2ParsedScript.metadata;
    
    return (
      <div className="flex gap-2 text-xs text-gray-600">
        <span>{totalChapters} chapter{totalChapters !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{totalScenes} scene{totalScenes !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{totalDialogues} dialogue{totalDialogues !== 1 ? 's' : ''}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dialogue Script</h2>
          </div>
          {getStatusBadge()}
        </div>
        
        {getMetadataDisplay()}
        
        <div className="text-xs text-gray-500 mt-1">
          Hierarchical syntax: Chapters → Scenes → Dialogues
        </div>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    {error}
                  </div>
                ))}
                {errors.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {errors.length - 5} more error{errors.length - 5 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Script Editor */}
      <div className="flex-1 p-4">
        <Textarea
          value={scriptText}
          onChange={(e) => handleScriptChange(e.target.value)}
          placeholder="Enter your manga script here..."
          className="min-h-[400px] font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Button
            onClick={handleFormatScript}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Format Script
          </Button>
          <Button
            onClick={() => console.log('📋 Current Parsed Result:', v2ParsedScript)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Log to Console
          </Button>
        </div>
        
      </div>
    </div>
  );
}