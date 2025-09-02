import { Moon, Sun, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBackToHome?: () => void;
}

export function Header({ theme, onToggleTheme, onBackToHome }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToHome && (
            <Button variant="ghost" size="sm" onClick={onBackToHome}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">OpenPRD</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="h-9 w-9 p-0"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
