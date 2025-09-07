import { Moon, Sun, ArrowLeft, FileText, Github, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBackToHome?: () => void;
}

export function Header({ theme, onToggleTheme, onBackToHome }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-amber-50/80 dark:bg-stone-950/80 backdrop-blur">
      <div className="container flex h-16 max-w-5xl items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToHome && (
            <Button variant="ghost" size="sm" onClick={onBackToHome}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">OpenPRD</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <a href="https://x.com/spencer_i_am" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Twitter className="h-4 w-4" />
              <span className="sr-only">X.com Profile</span>
            </Button>
          </a>
          <a href="https://github.com/spenceriam/openprd" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub Repository</span>
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-9 w-9"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
