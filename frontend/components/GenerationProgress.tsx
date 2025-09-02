import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface GenerationProgressProps {
  phase: string;
}

const PHASES = [
  { key: 'Testing connection', icon: Loader2, label: 'Testing Connection' },
  { key: 'Saving API key', icon: Loader2, label: 'Saving Configuration' },
  { key: 'Understanding requirements', icon: Brain, label: 'Understanding Requirements' },
  { key: 'Structuring PRD', icon: FileText, label: 'Structuring PRD' },
  { key: 'Optimizing for AI', icon: Sparkles, label: 'Optimizing for AI' },
  { key: 'Finalizing', icon: CheckCircle2, label: 'Finalizing' }
];

export function GenerationProgress({ phase }: GenerationProgressProps) {
  const currentPhaseIndex = PHASES.findIndex(p => phase.includes(p.key));
  const progress = currentPhaseIndex >= 0 ? ((currentPhaseIndex + 1) / PHASES.length) * 100 : 0;
  const CurrentIcon = currentPhaseIndex >= 0 ? PHASES[currentPhaseIndex].icon : Loader2;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100/50 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700">
            <CurrentIcon className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Generating Your PRD</h3>
          <p className="text-stone-600 dark:text-stone-400">{phase}</p>
        </div>
        
        <div className="space-y-4">
          <Progress value={progress} className="w-full [&>div]:bg-orange-500" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {PHASES.map((phaseItem, index) => {
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              
              return (
                <div
                  key={phaseItem.key}
                  className={`flex items-center gap-1.5 p-2 rounded-md ${
                    isCompleted ? 'text-green-700 bg-green-100 dark:bg-green-900/30' :
                    isCurrent ? 'text-orange-700 bg-amber-100/80 dark:bg-orange-900/30' :
                    'text-stone-500 bg-stone-100 dark:bg-stone-800/50'
                  }`}
                >
                  <phaseItem.icon className={`h-3.5 w-3.5 ${isCurrent ? 'animate-spin' : ''}`} />
                  <span>{phaseItem.label}</span>
                  {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
              );
            })}
          </div>
        </div>
        
        <p className="text-xs text-stone-500 dark:text-stone-400">
          This usually takes 10-30 seconds depending on your input complexity
        </p>
      </div>
    </div>
  );
}
