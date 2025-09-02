import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
  rememberKey: boolean;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onRememberKeyChange: (remember: boolean) => void;
}

interface ProviderData {
  name: string;
  models: Array<{
    name: string;
    contextWindow: number;
    inputCostPer1k: number;
    outputCostPer1k: number;
    description: string;
  }>;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  apiKey,
  rememberKey,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onRememberKeyChange
}: ModelSelectorProps) {
  const [providers, setProviders] = useState<Record<string, ProviderData>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider && providers[selectedProvider]) {
      const firstModel = providers[selectedProvider].models[0];
      if (firstModel && selectedModel !== firstModel.name) {
        onModelChange(firstModel.name);
      }
    }
  }, [selectedProvider, providers, selectedModel, onModelChange]);

  const loadProviders = async () => {
    try {
      const response = await backend.core.getModels();
      setProviders(response.providers);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const testConnection = async () => {
    if (!selectedProvider || !apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please select a provider and enter an API key",
        variant: "destructive"
      });
      return;
    }

    setConnectionStatus('testing');
    setConnectionError('');

    try {
      const result = await backend.core.testConnection({
        provider: selectedProvider,
        apiKey
      });

      if (result.valid) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: `Connected to ${selectedProvider} successfully`,
        });
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Unknown error');
        toast({
          title: "Connection Failed",
          description: result.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(errorMessage);
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const selectedModelInfo = selectedProvider && selectedModel && providers[selectedProvider] 
    ? providers[selectedProvider].models.find(m => m.name === selectedModel)
    : null;

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
          <label className="text-sm font-medium">Model</label>
          <Select 
            value={selectedModel} 
            onValueChange={onModelChange}
            disabled={!selectedProvider}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {selectedProvider && providers[selectedProvider]?.models.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  <div className="space-y-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {model.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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

      <div className="space-y-2">
        <label className="text-sm font-medium">API Key</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={`Enter your ${selectedProvider || 'API'} key`}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
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
            onClick={testConnection}
            disabled={!selectedProvider || !apiKey || connectionStatus === 'testing'}
            variant="outline"
          >
            {connectionStatus === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : connectionStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : connectionStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              'Test'
            )}
          </Button>
        </div>
        
        {connectionStatus === 'error' && connectionError && (
          <p className="text-sm text-red-600">{connectionError}</p>
        )}
      </div>

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
