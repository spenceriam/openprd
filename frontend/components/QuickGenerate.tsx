import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Sparkles, Loader2, Wand2, Settings, ChevronUp } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { GenerationProgress } from './GenerationProgress';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { GenerationResult } from '../App';

interface QuickGenerateProps {
  userId: string;
  onGenerationSuccess: (result: GenerationResult) => void;
}

const EXAMPLE_IDEAS = [
  "A Chrome extension that summarizes long PDFs and allows semantic search.",
  "A multi-tenant SaaS for automated invoice processing with OCR and QuickBooks integration.",
  "A community Q&A platform with AI-powered duplicate detection and gamified reputation."
];

export function QuickGenerate({ userId, onGenerationSuccess }: QuickGenerateProps) {
  const [inputText, setInputText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Load saved preferences
    const savedProvider = localStorage.getItem('openprd_provider');
    const savedModel = localStorage.getItem('openprd_model');
    const savedApiKey = localStorage.getItem('openprd_api_key');
    
    if (savedProvider) setSelectedProvider(savedProvider);
    if (savedModel) setSelectedModel(savedModel);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setRememberKey(true);
    }
  }, []);

  useEffect(() => {
    // Save preferences
    if (selectedProvider) localStorage.setItem('openprd_provider', selectedProvider);
    if (selectedModel) localStorage.setItem('openprd_model', selectedModel);
    if (rememberKey && apiKey) {
      localStorage.setItem('openprd_api_key', apiKey);
    } else {
      localStorage.removeItem('openprd_api_key');
    }
  }, [selectedProvider, selectedModel, apiKey, rememberKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your product idea",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProvider || !selectedModel || !apiKey) {
      setShowConfig(true);
      toast({
        title: "Configuration Required", 
        description: "Please select a provider, model, and enter your API key",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      setGenerationPhase('Testing connection...');
      const connectionTest = await backend.core.testConnection({
        provider: selectedProvider,
        apiKey
      });

      if (!connectionTest.valid) {
        throw new Error(connectionTest.error || 'Connection test failed');
      }

      if (rememberKey) {
        setGenerationPhase('Saving API key...');
        await backend.core.saveApiKey({
          userId,
          provider: selectedProvider,
          apiKey,
          label: `${selectedProvider} key`
        });
      }

      setGenerationPhase('Understanding requirements...');
      await new Promise(resolve => setTimeout(resolve, 700));
      setGenerationPhase('Structuring PRD...');
      await new Promise(resolve => setTimeout(resolve, 700));
      setGenerationPhase('Optimizing for AI...');
      await new Promise(resolve => setTimeout(resolve, 700));
      setGenerationPhase('Finalizing...');

      const result = await backend.core.generate({
        userId,
        input: inputText,
        mode: 'quick',
        provider: selectedProvider,
        model: selectedModel,
        outputMode: 'ai_agent'
      });

      onGenerationSuccess(result);
      
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationPhase('');
    }
  };

  if (isGenerating) {
    return <GenerationProgress phase={generationPhase} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-stone-900 dark:text-white">
          Turn ideas into
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"> developer-ready PRDs</span>
        </h1>
        <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          Paste your idea. Get a structured, token-optimized PRD designed for AI coding agents.
        </p>
      </div>

      {/* Main Interaction Area */}
      <div className="space-y-4">
        {/* Mode Selection */}
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-lg bg-stone-200/70 dark:bg-stone-800 p-1">
            <Button variant="ghost" className="w-40 bg-white dark:bg-stone-900 shadow text-stone-800 dark:text-white">
              <Wand2 className="h-4 w-4 mr-2" />
              Rapid PRD
            </Button>
            <Button variant="ghost" className="w-40 text-stone-500 dark:text-stone-400">
              <Sparkles className="h-4 w-4 mr-2" />
              Walkthrough PRD
            </Button>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-4 space-y-4 backdrop-blur-sm">
          <Textarea
            placeholder="Describe the application you want to build..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[160px] resize-none rounded-lg border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 text-base shadow-inner focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20 transition"
            maxLength={10000}
          />
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="h-4 w-4 mr-2" />
              AI Configuration
              <ChevronUp className={`ml-2 h-4 w-4 transition-transform duration-300 ${showConfig ? '' : 'rotate-180'}`} />
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!inputText.trim()}
              size="lg"
              className="bg-stone-800 hover:bg-stone-950 text-white dark:bg-white dark:text-black dark:hover:bg-stone-200 shadow-lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>

        {/* Collapsible AI Configuration */}
        <div className={`grid transition-all duration-500 ease-in-out ${showConfig ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <ModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              apiKey={apiKey}
              rememberKey={rememberKey}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              onApiKeyChange={setApiKey}
              onRememberKeyChange={(checked) => setRememberKey(Boolean(checked))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
