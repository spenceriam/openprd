import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { ModelInfo } from './types';
import { useDebounce } from '../hooks/useDebounce';

interface ProviderData {
  name: string;
  models: ModelInfo[];
}

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
  rememberKey: boolean;
  systemInstructions: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onRememberKeyChange: (remember: boolean) => void;
  onSystemInstructionsChange: (instructions: string) => void;
  onModelsFetched: (models: ModelInfo[] | null) => void;
  fetchedModels: ModelInfo[] | null;
}

const DEFAULT_SYSTEM_INSTRUCTIONS = `# SYSTEM INSTRUCTIONS  
Role: Senior Product Manager (ex-Software Engineer)  
Task: Produce a "rapid" PRD in markdown that an AI coding agent can consume directly (Cursor, Warp.dev, Claude Code, etc.).  
Constraints:  
- Zero follow-up questions—generate in one shot.  
- Token-frugal: no emojis, no marketing fluff, no repetition.  
- Omit testing details; instead append a single placeholder line:  
  \`<!-- TESTING: Ask user if testing needed; specify user-driven or automated -->\`  
- Target MVP—no future-proof abstractions.  
- Validate docs & versions at generation time; pin to latest stable (no betas).  
- Deliver two files:  
  1. \`PRD.md\` (this file)  
  2. \`todo.md\` (BMAD method, EARS syntax, ready for Spec-driven dev)

---

# PRD TEMPLATE (copy everything below into PRD.md)

# PRD – {Feature Name}
Date: 2025-09-05  
Author: AI-PM  
Status: Draft → Ready for Build  

## 1. Problem (1 sentence)
{Clear pain point or opportunity.}

## 2. Goal (1 sentence)
{Measurable outcome for user & business.}

## 3. Definition of Done
- Code merged to \`main\`  
- Feature flag enabled in prod for 100% users  
- No P1 bugs open  

## 4. User Story (EARS)
**E** – While \`{context}\`  
**A** – \`{user type}\` shall \`{action}\`  
**R** – so that \`{result}\`  
**S** – \`{system response}\`  

## 5. Functional Requirements
| ID | Requirement | Acceptance Criteria |
|---|---|---|
| F1 | … | … |

## 6. Non-Functional Requirements
- Latency ≤ 200 ms p95  
- Supports 1 k rps on 2 vCPU  
- Uses only stable dependencies (checked 2025-09-05)  

## 7. Tech Notes
- Language & framework pinned to current LTS  
- Keep stateless; persist only in {existing DB}  
- Reuse \`{existing service}\`—no new infra  

## 8. Open Issues
<!-- TESTING: Ask user if testing needed; specify user-driven or automated -->

## 9. Rollback Plan
Flip feature flag \`{flagName}\` → off (instant).

---

# TODO TEMPLATE (copy everything below into todo.md)

# Todo – BMAD / EARS Spec-Driven

## Bucket 1 – Backend
- [ ] B1 Implement endpoint \`POST /api/v1/{resource}\` – EARS story F1  
- [ ] B2 Add DB migration \`001_add_column.sql\` – idempotent, backward compat  

## Bucket 2 – Model
- [ ] M1 Define domain object \`{Name}\` – fields: id, createdAt, updatedAt  

## Bucket 3 – API
- [ ] A1 OpenAPI spec v3.1 – validate with \`redocly lint\`  
- [ ] A2 Generate client SDK – \`openapi-generator-cli\` latest stable  

## Bucket 4 – Delivery
- [ ] D1 Feature flag \`{flagName}\` created in LaunchDarkly  
- [ ] D2 CI passes (build, lint, unit tests)  
- [ ] D3 Deploy to prod via existing GitHub Action \`deploy-prod.yml\`

---

# GENERATION RULES (internal, do not output)
1. Replace every \`{placeholder}\` inline—no brackets left.  
2. Pin versions: look up latest stable on npm, Maven, PyPI, etc., at runtime.  
3. Keep sentences ≤ 15 words.  
4. If conflict between brevity and clarity, choose clarity but compress.  
5. After generation, silently verify:  
   - All dependencies have non-beta tags.  
   - All paths/services referenced exist in current repo (assume monorepo root).  
6. Emit only the two files above—no extra commentary.`;

export function ModelSelector({
  selectedProvider,
  selectedModel,
  apiKey,
  rememberKey,
  systemInstructions,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onRememberKeyChange,
  onSystemInstructionsChange,
  onModelsFetched,
  fetchedModels,
}: ModelSelectorProps) {
  const [providers, setProviders] = useState<Record<string, ProviderData>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSystemInstructions, setShowSystemInstructions] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');
  const debouncedApiKey = useDebounce(apiKey, 1000);

  const { toast } = useToast();

  useEffect(() => {
    backend.core.getModels().then(res => setProviders(res.providers));
  }, []);

  useEffect(() => {
    onModelsFetched(null);
    onModelChange('');
    setValidationStatus('idle');
    setConnectionError('');
  }, [selectedProvider, onModelsFetched, onModelChange]);

  const handleFetchModels = useCallback(async () => {
    if (!selectedProvider || !apiKey) {
      return;
    }

    setValidationStatus('loading');
    setConnectionError('');
    onModelsFetched(null);

    try {
      const modelsResponse = await backend.core.listProviderModels({ provider: selectedProvider, apiKey });
      
      onModelsFetched(modelsResponse.models);
      if (modelsResponse.models.length > 0) {
        onModelChange(modelsResponse.models[0].name);
      }
      setValidationStatus('success');
      toast({ title: "Connected!", description: `Successfully fetched models for ${providers[selectedProvider].name}.` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConnectionError(errorMessage);
      setValidationStatus('error');
      console.error('Failed to fetch models:', error);
      toast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
    }
  }, [selectedProvider, apiKey, onModelsFetched, onModelChange, providers, toast]);

  useEffect(() => {
    if (debouncedApiKey && selectedProvider) {
      handleFetchModels();
    }
  }, [debouncedApiKey, selectedProvider, handleFetchModels]);

  const selectedModelInfo = fetchedModels?.find(m => m.name === selectedModel) || null;

  const handleResetSystemInstructions = () => {
    onSystemInstructionsChange(DEFAULT_SYSTEM_INSTRUCTIONS);
    toast({ title: "Reset Complete", description: "System instructions have been reset to default." });
  };

  const getPreviewText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              {validationStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
              {validationStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {validationStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
            </div>
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={`Enter your ${providers[selectedProvider]?.name || 'API'} key`}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              disabled={!selectedProvider}
              className="pl-10"
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
          {connectionError && <p className="text-sm text-red-600 mt-1">{connectionError}</p>}
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

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">System Instructions</label>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            These AI instructions will be used to create your PRD. The default instructions will generate a PRD with todo.md ready for AI coding agents like Cursor or Claude Code. You can modify these to suit your specific needs.
          </p>
        </div>

        <div className="border border-stone-200 dark:border-stone-700 rounded-lg">
          <div 
            className="p-3 cursor-pointer flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 rounded-t-lg border-b border-stone-200 dark:border-stone-700"
            onClick={() => setShowSystemInstructions(!showSystemInstructions)}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium mb-1">System Instructions Preview</div>
              <div className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                {getPreviewText(systemInstructions || DEFAULT_SYSTEM_INSTRUCTIONS)}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
              {showSystemInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showSystemInstructions && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Full Instructions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSystemInstructions}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset to Default
                </Button>
              </div>
              <Textarea
                value={systemInstructions || DEFAULT_SYSTEM_INSTRUCTIONS}
                onChange={(e) => onSystemInstructionsChange(e.target.value)}
                className="min-h-[200px] font-mono text-xs resize-none"
                placeholder="Enter your system instructions..."
              />
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Note: Changes to system instructions are temporary and will revert to default on page refresh.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
