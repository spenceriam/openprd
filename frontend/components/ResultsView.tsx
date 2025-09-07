import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { GenerationResult } from '../App';

interface ResultsViewProps {
  result: GenerationResult;
  onBackToHome: () => void;
}

export function ResultsView({ result, onBackToHome }: ResultsViewProps) {
  const { toast } = useToast();

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      toast({
        title: "Copied to Clipboard",
        description: "Full PRD copied successfully",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `PRD downloaded as ${result.filename}`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>PRD Generated Successfully</CardTitle>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-stone-600 dark:text-stone-400">
              <span>{result.tokens.toLocaleString()} tokens</span>
              <span>${result.cost.toFixed(4)} cost</span>
              <span>{result.sections.length} sections</span>
              <span className="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">{result.filename}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={onBackToHome} variant="outline" size="sm">
              Generate New
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader className="border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Generated PRD</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {result.filename}
              </Badge>
            </div>
            <Button onClick={handleCopyMarkdown} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy Markdown
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <pre className="p-6 rounded-b-lg overflow-auto bg-stone-100 dark:bg-stone-800 text-sm font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
            <code>{result.content}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
