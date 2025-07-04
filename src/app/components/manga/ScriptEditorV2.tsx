'use client';

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { AlertCircle, Code2, CheckCircle, XCircle } from 'lucide-react';
import { parseMangaScriptV2, type ParsedMangaScript } from '@/app/utils/mangaScriptV2Parser';

const DEFAULT_V2_SCRIPT = `# Chapter 1: The Storm Approaches

* Opening Scene: Dark clouds gather over the city as our heroes prepare for battle

Kenji: speech: {200,300} The storm is coming faster than we expected.
Yumi: thought: {500,200} I can sense something dark in those clouds.
Ryo: speech: {700,450} We need to evacuate the civilians immediately!

* The Evacuation: Chaos fills the streets as people flee from the approaching storm

Kenji: shout: {100,150} Everyone move to the shelters!
Civilian: speech: {400,300} What about the children at the school?
Yumi: speech: {600,400} I'll handle the school. You two focus on the residential area.

* The Storm Hits: Lightning tears through the sky as the supernatural storm begins

Narrator: narrator: {400,50} As the first lightning bolt struck, the city knew this was no ordinary storm.
Kenji: shout: {200,500} Take cover!
Yumi: thought: {800,200} This feels... familiar. Like I've seen this before.`;

export function ScriptEditorV2() {
  const [scriptText, setScriptText] = useState(DEFAULT_V2_SCRIPT);
  const [parsedResult, setParsedResult] = useState<ParsedMangaScript | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Parse script in real-time
  const parseScript = useCallback((text: string) => {
    try {
      const result = parseMangaScriptV2(text);
      setParsedResult(result);
      setIsValid(result.errors.filter(err => err.severity === 'error').length === 0);
      
      // Log to console for testing
      console.group('🎭 Manga Script V2.0 Parser Result');
      console.log('📝 Script Text:', text);
      console.log('📊 Parsed Result:', result);
      console.log('✅ Is Valid:', result.errors.filter(err => err.severity === 'error').length === 0);
      console.log('📈 Metadata:', result.metadata);
      
      if (result.errors.length > 0) {
        console.warn('⚠️ Parse Errors:', result.errors);
      }
      
      if (result.chapters.length > 0) {
        console.log('📚 Chapters:', result.chapters.map(ch => ({
          id: ch.id,
          name: ch.name,
          sceneCount: ch.scenes.length,
          totalDialogues: ch.scenes.reduce((sum, scene) => sum + scene.dialogues.length, 0)
        })));
      }
      
      console.groupEnd();
    } catch (error) {
      console.error('❌ Parser Error:', error);
      setIsValid(false);
    }
  }, []);

  // Parse on mount and when script changes
  useEffect(() => {
    parseScript(scriptText);
  }, [scriptText, parseScript]);

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
    if (!parsedResult) {
      return <Badge variant="secondary">Parsing...</Badge>;
    }
    
    const errorCount = parsedResult.errors.filter(err => err.severity === 'error').length;
    const warningCount = parsedResult.errors.filter(err => err.severity === 'warning').length;
    
    if (errorCount > 0) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{errorCount} Error{errorCount !== 1 ? 's' : ''}</Badge>;
    }
    
    if (warningCount > 0) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />{warningCount} Warning{warningCount !== 1 ? 's' : ''}</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
  };

  const getMetadataDisplay = () => {
    if (!parsedResult?.metadata) return null;
    
    const { totalChapters, totalScenes, totalDialogues } = parsedResult.metadata;
    
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
            <h2 className="text-lg font-semibold text-gray-900">Script Editor V2.0</h2>
          </div>
          {getStatusBadge()}
        </div>
        
        {getMetadataDisplay()}
        
        <div className="text-xs text-gray-500 mt-1">
          New hierarchical syntax: Chapters → Scenes → Dialogues (Console logging enabled)
        </div>
      </div>

      {/* Error Display */}
      {parsedResult?.errors && parsedResult.errors.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {parsedResult.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">Line {error.line}:</span>{' '}
                    <span className={error.severity === 'error' ? 'text-red-600' : 'text-amber-600'}>
                      {error.error}
                    </span>
                  </div>
                ))}
                {parsedResult.errors.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {parsedResult.errors.length - 5} more error{parsedResult.errors.length - 5 !== 1 ? 's' : ''}
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
          placeholder="Enter your manga script using the new V2.0 syntax..."
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
            onClick={() => console.log('📋 Current Parsed Result:', parsedResult)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Log to Console
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Open browser console to see real-time parsing results
        </div>
      </div>
    </div>
  );
}