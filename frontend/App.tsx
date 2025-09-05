import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuickGenerate } from './components/QuickGenerate';
import { ResultsView } from './components/ResultsView';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import AnimatedGridPattern from '@/components/magicui/AnimatedGridPattern';
import { cn } from '@/lib/utils';

export interface GenerationResult {
  prdId: number;
  content: string;
  tokens: number;
  cost: number;
  sections: Array<{
    id: number;
    type: string;
    content: string;
    tokens: number;
  }>;
}

function App() {
  const [userId] = useState(() => {
    let id = localStorage.getItem('openprd_user_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('openprd_user_id', id);
    }
    return id;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('openprd_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Respect system preference if available, otherwise default to light mode
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('openprd_theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const handleGenerationSuccess = (result: GenerationResult) => {
    setGenerationResult(result);
    setCurrentView('results');
    toast({
      title: "PRD Generated Successfully",
      description: `Generated ${result.tokens} tokens for $${result.cost.toFixed(4)}`,
    });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setGenerationResult(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <style>
        {`
          @keyframes fade {
            from { opacity: 0; }
            to { opacity: var(--max-opacity); }
          }
        `}
      </style>
      <div className="min-h-screen bg-amber-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200 relative isolate">
        <AnimatedGridPattern
          width={30}
          height={30}
          x={-1}
          y={-1}
          numSquares={30}
          maxOpacity={0.08}
          duration={6}
          className={cn(
            "[mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]",
            "fill-stone-300/30 stroke-stone-300/30 dark:fill-stone-700/30 dark:stroke-stone-700/30"
          )}
        />
        <Header 
          theme={theme} 
          onToggleTheme={toggleTheme}
          onBackToHome={currentView === 'results' ? handleBackToHome : undefined}
        />
        
        <main className="container mx-auto px-4 py-8 md:py-16 relative z-10">
          {currentView === 'home' && (
            <QuickGenerate 
              userId={userId}
              onGenerationSuccess={handleGenerationSuccess}
            />
          )}
          
          {currentView === 'results' && generationResult && (
            <ResultsView 
              result={generationResult}
              onBackToHome={handleBackToHome}
            />
          )}
        </main>
        
        <Toaster />
      </div>
    </>
  );
}

export default App;
