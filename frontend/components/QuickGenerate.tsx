import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles, Loader2, Wand2, Stars } from 'lucide-react';
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
  "Build a Chrome extension that summarizes long PDFs with citations and allows semantic search across highlights.",
  "Create a multi-tenant SaaS for automated invoice processing with OCR, approval workflows, and QuickBooks integrations.",
  "Launch a community Q&A platform with AI-powered duplicate detection, suggested answers, and gamified reputation."
];

export function QuickGenerate({ userId, onGenerationSuccess }: QuickGenerateProps) {
  const [inputText, setInputText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [tokenEstimate, setTokenEstimate] = useState(0);
  const [costEstimate, setCostEstimate] = useState(0);

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

  useEffect(() => {
    // Update token and cost estimates
    if (inputText.trim()) {
      const estimatedTokens = Math.ceil(inputText.length / 4) + 3000; // Input + expected output
      setTokenEstimate(estimatedTokens);
      
      // Rough estimate; exact pricing depends on chosen model
      const estimatedCost = (estimatedTokens / 1000) * 0.01;
      setCostEstimate(estimatedCost);
    } else {
      setTokenEstimate(0);
      setCostEstimate(0);
    }
  }, [inputText, selectedModel]);

  const handleExampleClick = (example: string) => {
    setInputText(example);
  };

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
      toast({
        title: "Configuration Required", 
        description: "Please select a provider, model, and enter your API key",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Test connection first
      setGenerationPhase('Testing connection...');
      const connectionTest = await backend.core.testConnection({
        provider: selectedProvider,
        apiKey
      });

      if (!connectionTest.valid) {
        throw new Error(connectionTest.error || 'Connection test failed');
      }

      // Save API key if requested
      if (rememberKey) {
        setGenerationPhase('Saving API key...');
        await backend.core.saveApiKey({
          userId,
          provider: selectedProvider,
          apiKey,
          label: `${selectedProvider} key`
        });
      }

      // Simulate phases for UX
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
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-600/15 text-orange-800 ring-1 ring-orange-200">
          <Stars className="h-3.5 w-3.5 text-orange-800" />
          AI-Powered PRD Generator
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-orange-900">
          Turn ideas into
          <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent"> developer-ready PRDs</span>
        </h1>
        <p className="text-base md:text-lg text-orange-700 max-w-2xl mx-auto">
          Paste your idea. Get a structured, token-optimized PRD designed for AI coding agents.
        </p>

        {/* Mode Selection (single page; no side panel) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="border-2 border-orange-300 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-orange-800" />
                <CardTitle className="text-orange-900">Rapid PRD</CardTitle>
                <Badge className="bg-orange-800 text-orange-50">Selected</Badge>
              </div>
              <CardDescription className="text-orange-700">Paste an idea. Generate a full PRD fast.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="opacity-80 border-orange-200 bg-gradient-to-br from-amber-25 to-orange-25">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-700">Walkthrough PRD</CardTitle>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">Coming soon</Badge>
              </div>
              <CardDescription className="text-orange-600">Guided questions for meticulous planning.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Prompt Box - Main Focus */}
      <Card className="shadow-lg border-2 border-orange-200 bg-gradient-to-br from-orange-25 to-amber-25">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Zap className="h-5 w-5 text-orange-800" />
            Describe your product idea
          </CardTitle>
          <CardDescription className="text-orange-700">Focus on outcomes, target users, and core features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white ring-1 ring-orange-200 focus-within:ring-2 focus-within:ring-orange-400 transition">
            <Textarea
              placeholder="Example: Build a platform that helps indie hackers launch faster by auto-generating PRDs, technical architecture, and test cases. It should support OpenAI, Anthropic, Gemini, and OpenRouter. Include a wizard for refining ideas and a validation assistant to check generated code against requirements..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[220px] resize-vertical border-0 ring-0 focus:ring-0 text-orange-900"
              maxLength={10000}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between text-sm">
            <div className="text-orange-700">
              {inputText.length}/10,000 characters • {tokenEstimate > 0 ? `~${tokenEstimate.toLocaleString()} tokens` : 'token estimate appears as you type'}
              {tokenEstimate > 0 && <> • ~${costEstimate.toFixed(4)} est.</>}
            </div>

            <div className="flex gap-2">
              {inputText.length === 0 && (
                <div className="hidden sm:flex items-center gap-2 text-orange-700">
                  Try:
                  {EXAMPLE_IDEAS.slice(0, 2).map((example, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(example)}
                      className="h-auto py-1 px-2 border-orange-300 text-orange-800 hover:bg-orange-50"
                    >
                      {idx === 0 ? 'PDF Extension' : 'Invoice SaaS'}
                    </Button>
                  ))}
                </div>
              )}
              <Button
                onClick={handleGenerate}
                disabled={!inputText.trim() || !selectedProvider || !selectedModel || !apiKey}
                size="lg"
                className="bg-orange-800 hover:bg-orange-900 text-orange-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PRD...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate PRD
                  </>
                )}
              </Button>
            </div>
          </div>

          {inputText.length === 0 && (
            <div className="space-y-2 sm:hidden">
              <p className="text-sm font-medium text-orange-900">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_IDEAS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    className="text-left h-auto p-3 whitespace-normal border-orange-300 text-orange-800 hover:bg-orange-50"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-orange-600 text-center">
            Press Cmd+Enter to generate quickly
          </p>
        </CardContent>
      </Card>

      {/* Options (AI Model Configuration underneath prompt) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-orange-700">
            Generation Options
          </h2>
        </div>
        <ModelSelector
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          apiKey={apiKey}
          rememberKey={rememberKey}
          onProviderChange={setSelectedProvider}
          onModelChange={setSelectedModel}
          onApiKeyChange={setApiKey}
          onRememberKeyChange={setRememberKey}
        />
      </div>
    </div>
  );
}
