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
    // Simple markdown to HTML conversion for display
    return content
      .replace(/^### (.+$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-orange-900">$1</h3>')
      .replace(/^## (.+$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3 text-orange-900">$1</h2>')
      .replace(/^# (.+$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-orange-900">$1</h1>')
      .replace(/^\- (.+$)/gm, '<li class="ml-4 text-orange-800">• $1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-orange-900">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-orange-800">$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-orange-100 text-orange-900 px-1 py-0.5 rounded text-sm border border-orange-200">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with stats */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-25 to-amber-25">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orange-900">PRD Generated Successfully</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-orange-700">
                <span>{result.tokens.toLocaleString()} tokens</span>
                <span>${result.cost.toFixed(4)} cost</span>
                <span>{result.sections.length} sections</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleCopyAll} variant="outline" size="sm" className="border-orange-300 text-orange-800 hover:bg-orange-50">
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm" className="border-orange-300 text-orange-800 hover:bg-orange-50">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={onBackToHome} variant="outline" size="sm" className="border-orange-300 text-orange-800 hover:bg-orange-50">
                Generate New
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {result.sections.map((section, index) => (
          <Card key={section.id} className="group border-orange-200 bg-white hover:bg-orange-25/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base capitalize text-orange-900">
                    {section.type.replace(/_/g, ' ')}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                    {section.tokens} tokens
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopySection(section.content, section.id)}
                    className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                  >
                    {copiedSection === section.id ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-orange-200">
                      <DropdownMenuItem className="text-orange-800 hover:bg-orange-50">
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Regenerate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-orange-800 hover:bg-orange-50">
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div 
                className="prose prose-sm max-w-none text-orange-800"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(section.content) }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer actions */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-25 to-amber-25">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-sm text-orange-700">
            Need to make changes? You can regenerate individual sections or create a new PRD.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={onBackToHome} variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-50">
              Generate New PRD
            </Button>
            <Button onClick={handleCopyAll} className="bg-orange-800 hover:bg-orange-900 text-orange-50">
              Copy Full PRD
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
