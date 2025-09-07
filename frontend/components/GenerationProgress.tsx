import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GenerationProgressProps {
  phase: string;
}

const FUN_QUIPS = [
  "AI cooking PRD... smells good",
  "Sprinkling some magic dust on your requirements",
  "Teaching robots to write better than humans",
  "Converting caffeine into documentation",
  "Assembling words into meaningful sentences",
  "Negotiating with the specification fairies",
  "Building your PRD brick by digital brick",
  "Translating 'umm' and 'like' into professional language",
  "Organizing chaos into structured brilliance",
  "Making your ideas sound way smarter",
  "Channeling the spirit of product managers past",
  "Turning dreams into actionable items",
  "Consulting the ancient scrolls of agile methodology",
  "Weaving together threads of user stories",
  "Performing dark magic on your requirements",
];

export function GenerationProgress({ phase }: GenerationProgressProps) {
  const [currentQuip, setCurrentQuip] = useState(FUN_QUIPS[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 3 + 1;
      });
    }, 100);

    // Change quips every 2-3 seconds
    const quipInterval = setInterval(() => {
      const randomQuip = FUN_QUIPS[Math.floor(Math.random() * FUN_QUIPS.length)];
      setCurrentQuip(randomQuip);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(quipInterval);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700">
            <Bot className="h-8 w-8 text-orange-600 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Generating Your PRD</h3>
          <p className="text-stone-600 dark:text-stone-400 min-h-[1.5rem]">{currentQuip}</p>
        </div>
        
        <div className="space-y-4">
          <Progress value={Math.min(progress, 95)} className="w-full [&>div]:bg-orange-500" />
        </div>
        
        <p className="text-xs text-stone-500 dark:text-stone-400">
          This usually takes 10-30 seconds depending on your input complexity
        </p>
      </div>
    </div>
  );
}
