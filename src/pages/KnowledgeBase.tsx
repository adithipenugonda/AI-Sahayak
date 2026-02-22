import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Brain, BookOpen, Globe, GraduationCap, Lightbulb, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const languages = ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Odia', 'Punjabi', 'Urdu'];

export default function KnowledgeBase() {
  const { toast } = useToast();
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!className || !subject || !topic || !language) {
      toast({ title: 'Missing Fields', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-base', {
        body: { className, subject, topic, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.content || 'No content generated.');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to generate.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied!', description: 'Explanation copied to clipboard.' });
  };

  const parseSection = (text: string, heading: string): string => {
    const regex = new RegExp(`##\\s*${heading}[\\s\\S]*?(?=##|$)`, 'i');
    const match = text.match(regex);
    if (!match) return '';
    return match[0].replace(new RegExp(`##\\s*${heading}`, 'i'), '').trim();
  };

  const renderResult = () => {
    if (!result) return null;

    const sections = [
      { title: 'English Explanation', icon: BookOpen, content: parseSection(result, 'English Explanation') },
      { title: `${language} Explanation`, icon: Globe, content: parseSection(result, `${language} Explanation`) },
      { title: 'Real-Life Example', icon: Lightbulb, content: parseSection(result, 'Real-Life Example') },
      { title: 'Practice Question', icon: GraduationCap, content: parseSection(result, 'Practice Question') },
      { title: 'Blackboard Summary', icon: Brain, content: parseSection(result, 'Blackboard Summary') },
    ];

    return (
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Generated Explanation</h2>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" /> Copy All
          </Button>
        </div>
        {sections.map((section) => {
          if (!section.content) return null;
          const Icon = section.icon;
          return (
            <Card key={section.title} className="card-elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{section.content}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
            <Brain className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="page-header">Instant Knowledge Base</h1>
            <p className="text-muted-foreground">Bilingual explanations for blackboard teaching</p>
          </div>
        </div>

        <Card className="card-elevated">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="e.g., Science, Maths, Social Studies" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input placeholder="e.g., Photosynthesis, Fractions" value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Local Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                  <SelectContent>
                    {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Brain className="h-4 w-4 mr-2" /> Generate Explanation</>}
            </Button>
          </CardContent>
        </Card>

        {renderResult()}
      </div>
    </MainLayout>
  );
}
