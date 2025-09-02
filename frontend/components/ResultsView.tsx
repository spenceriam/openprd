import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, RefreshCw, Edit, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import type { GenerationResult } from '../App';

interface ResultsViewProps {
  result: GenerationResult;
  onBackToHome: () => void;
}

export function ResultsView({ result, onBackToHome }: ResultsViewProps) {
  const [copiedSection, setCopiedSection] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCopyAll = async () => {
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

  const handleCopySection = async (content: string, sectionId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
      toast({
        title: "Section Copied",
        description: "Section copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy section:', error);
      toast({
        title: "Copy Failed", 
        description: "Failed to copy section",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prd.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "PRD downloaded as prd.md",
    });
  };

  const formatMarkdown = (content: string) => {
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote class="mt-6 border-l-2 pl-6 italic">$1</blockquote>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
      .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' class='text-orange-600 hover:underline'>$1</a>")
      .replace(/`(.*?)`/gim, '<code class="bg-amber-100/50 text-orange-700 dark:bg-stone-800 dark:text-amber-400 px-1 py-0.5 rounded text-sm border border-stone-200 dark:border-stone-700">$1</code>')
      .replace(/^\s*[-*+] (.*)/gim, '<li class="ml-4 my-1 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>PRD Generated Successfully</CardTitle>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-stone-600 dark:text-stone-400">
              <span>{result.tokens.toLocaleString()} tokens</span>
              <span>${result.cost.toFixed(4)} cost</span>
              <span>{result.sections.length} sections</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleCopyAll} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy All
            </Button>
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

      <div className="space-y-4">
        {result.sections.map((section) => (
          <Card key={section.id} className="group bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base capitalize">
                    {section.type.replace(/_/g, ' ')}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs bg-amber-100/60 text-orange-700 dark:bg-stone-800 dark:text-amber-400">
                    {section.tokens} tokens
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopySection(section.content, section.id)}
                    className="h-8 w-8"
                  >
                    {copiedSection === section.id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-stone-800 dark:prose-headings:text-stone-200"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(section.content) }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
