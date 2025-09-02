import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { ModelInfo } from './types';

interface ProviderData {
  name: string;
  models: ModelInfo[];
}

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
  rememberKey: boolean;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onRememberKeyChange: (remember: boolean) => void;
  onModelsFetched: (models: ModelInfo[] | null) => void;
  fetchedModels: ModelInfo[] | null;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  apiKey,
  rememberKey,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onRememberKeyChange,
  onModelsFetched,
  fetchedModels,
}: ModelSelectorProps) {
  const [providers, setProviders] = useState<Record<string, ProviderData>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    backend.core.getModels().then(res => setProviders(res.providers));
  }, []);

  useEffect(() => {
    onModelsFetched(null);
    onModelChange('');
  }, [selectedProvider, onModelsFetched, onModelChange]);

  const handleFetchModels = async () => {
    if (!selectedProvider || !apiKey) {
      toast({ title: "Missing Info", description: "Please select a provider and enter an API key.", variant: "destructive" });
      return;
    }

    setIsLoadingModels(true);
    setConnectionError('');
    onModelsFetched(null);

    try {
      const modelsResponse = await backend.core.listProviderModels({ provider: selectedProvider, apiKey });
      
      onModelsFetched(modelsResponse.models);
      if (modelsResponse.models.length > 0) {
        onModelChange(modelsResponse.models[0].name);
      }
      toast({ title: "Connected!", description: `Successfully fetched models for ${providers[selectedProvider].name}.` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConnectionError(errorMessage);
      console.error('Failed to fetch models:', error);
      toast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const selectedModelInfo = fetchedModels?.find(m => m.name === selectedModel) || null;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-6 space-y-6 backdrop-blur-sm">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <Select value={selectedProvider} onValueChange={onProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(providers).map(([key, provider]) => (
                <SelectItem key={key} value={key}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder={`Enter your ${providers[selectedProvider]?.name || 'API'} key`}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                disabled={!selectedProvider}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={handleFetchModels}
              disabled={!selectedProvider || !apiKey || isLoadingModels}
              variant="outline"
            >
              {isLoadingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
            </Button>
          </div>
          {connectionError && <p className="text-sm text-red-600">{connectionError}</p>}
        </div>
      </div>

      {fetchedModels && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <Select value={selectedModel} onValueChange={onModelChange} disabled={!fetchedModels}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {fetchedModels.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedModelInfo && (
        <div className="p-3 bg-amber-100/50 dark:bg-stone-800/50 rounded-lg space-y-2 border border-stone-200 dark:border-stone-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Context Window</span>
            <span className="text-sm text-stone-600 dark:text-stone-300">{selectedModelInfo.contextWindow.toLocaleString()} tokens</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Cost (Input/Output)</span>
            <span className="text-sm text-stone-600 dark:text-stone-300">
              ${selectedModelInfo.inputCostPer1k.toFixed(4)} / ${selectedModelInfo.outputCostPer1k.toFixed(4)} per 1K tokens
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-key"
          checked={rememberKey}
          onCheckedChange={(checked) => onRememberKeyChange(Boolean(checked))}
        />
        <label htmlFor="remember-key" className="text-sm">
          Remember my API key (encrypted and stored locally)
        </label>
      </div>
    </div>
  );
}
