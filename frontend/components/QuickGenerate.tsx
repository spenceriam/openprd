import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Sparkles, Loader2, Wand2, Settings, ChevronUp } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { GenerationProgress } from './GenerationProgress';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { GenerationResult } from '../App';
import type { ModelInfo } from './types';

interface QuickGenerateProps {
  userId: string;
  onGenerationSuccess: (result: GenerationResult) => void;
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

export function QuickGenerate({ userId, onGenerationSuccess }: QuickGenerateProps) {
  const [inputText, setInputText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [systemInstructions, setSystemInstructions] = useState(DEFAULT_SYSTEM_INSTRUCTIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<ModelInfo[] | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const savedProvider = localStorage.getItem('openprd_provider');
    const savedApiKey = localStorage.getItem('openprd_api_key');
    if (savedProvider) setSelectedProvider(savedProvider);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setRememberKey(true);
    }
  }, []);

  useEffect(() => {
    if (rememberKey) {
      localStorage.setItem('openprd_provider', selectedProvider);
      localStorage.setItem('openprd_api_key', apiKey);
    } else {
      localStorage.removeItem('openprd_provider');
      localStorage.removeItem('openprd_api_key');
    }
  }, [selectedProvider, apiKey, rememberKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({ title: "Input Required", description: "Please enter your product idea.", variant: "destructive" });
      return;
    }

    if (!selectedProvider || !selectedModel || !apiKey || !fetchedModels) {
      setShowConfig(true);
      toast({ title: "Configuration Required", description: "Please select a provider, enter your API key, and fetch available models.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
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
        outputMode: 'ai_agent',
        apiKey: apiKey,
        systemInstructions: systemInstructions,
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
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-stone-900 dark:text-white">
          Turn ideas into
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"> developer-ready PRDs</span>
        </h1>
        <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          <span className="text-orange-600">Paste your idea.</span> Get a structured, token-optimized PRD designed for AI coding agents.
        </p>
      </div>

      <div className="space-y-4">
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
              AI API/System Instructions
              <ChevronUp className={`ml-2 h-4 w-4 transition-transform duration-300 ${showConfig ? '' : 'rotate-180'}`} />
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!inputText.trim()}
              size="lg"
              className="bg-stone-800 hover:bg-stone-950 text-white dark:bg-white dark:text-black dark:hover:bg-stone-200 shadow-lg"
            >
              <Bot className="h-4 w-4 mr-2" />
              Create PRD
            </Button>
          </div>
        </div>

        <div className={`grid transition-all duration-500 ease-in-out ${showConfig ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <ModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              apiKey={apiKey}
              rememberKey={rememberKey}
              systemInstructions={systemInstructions}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              onApiKeyChange={setApiKey}
              onRememberKeyChange={setRememberKey}
              onSystemInstructionsChange={setSystemInstructions}
              fetchedModels={fetchedModels}
              onModelsFetched={setFetchedModels}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
