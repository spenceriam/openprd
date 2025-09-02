import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuickGenerate } from './components/QuickGenerate';
import { ResultsView } from './components/ResultsView';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

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
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('openprd_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme}
        onBackToHome={currentView === 'results' ? handleBackToHome : undefined}
      />
      
      <main className="container mx-auto px-4 py-8">
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
  );
}

export default App;
