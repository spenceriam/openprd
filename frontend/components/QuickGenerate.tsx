import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles, Loader2 } from 'lucide-react';
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
  "A habit tracking app that gamifies daily routines with RPG-style progression",
  "A collaborative code review tool with AI-powered suggestions",
  "A personal finance dashboard that automatically categorizes expenses"
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
      
      // TODO: Get actual model pricing
      const estimatedCost = (estimatedTokens / 1000) * 0.01; // Rough estimate
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

      // Generate PRD
      setGenerationPhase('Understanding requirements...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationPhase('Structuring PRD...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationPhase('Optimizing for AI...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Transform Ideas into 
          <span className="text-primary"> AI-Ready PRDs</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate professional Product Requirements Documents optimized for AI coding agents. 
          Bring your own API key for complete control.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Quick Generate</CardTitle>
              <Badge>Active</Badge>
            </div>
            <CardDescription>
              Paste your idea and get a complete PRD in seconds
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle>Guided Wizard</CardTitle>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <CardDescription>
              Answer targeted questions for refined PRDs
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Configuration */}
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

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Product Idea</CardTitle>
          <CardDescription>
            Be as detailed as possible. The more context you provide, the better your PRD will be.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: A habit tracking app that gamifies daily routines with RPG-style progression, including character leveling, equipment unlocks, and social challenges..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px]"
            maxLength={10000}
          />
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{inputText.length}/10,000 characters</span>
            {tokenEstimate > 0 && (
              <span>~{tokenEstimate.toLocaleString()} tokens • ${costEstimate.toFixed(4)}</span>
            )}
          </div>

          {inputText.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_IDEAS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    className="text-left h-auto p-3 whitespace-normal"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!inputText.trim() || !selectedProvider || !selectedModel || !apiKey}
            className="w-full"
            size="lg"
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
          
          <p className="text-xs text-muted-foreground text-center">
            Press Cmd+Enter to generate quickly
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
