import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Image, Plus, Trash2, Wand2, Download, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TopicEntry {
  id: string;
  grade: string;
  subject: string;
  topicName: string;
}

interface GeneratedImage {
  grade: number;
  topic: string;
  subject: string;
  imageUrl?: string;
  description?: string;
  error?: string;
}

const grades = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const subjects = ['Science', 'Mathematics', 'Social Studies', 'English', 'Hindi', 'Environmental Studies', 'Geography', 'History', 'Biology', 'Physics', 'Chemistry'];

export default function VisualAidDesign() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<TopicEntry[]>([
    { id: crypto.randomUUID(), grade: '', subject: '', topicName: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);

  const addTopic = () => {
    setTopics(prev => [...prev, { id: crypto.randomUUID(), grade: '', subject: '', topicName: '' }]);
  };

  const removeTopic = (id: string) => {
    if (topics.length <= 1) return;
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const updateTopic = (id: string, field: keyof TopicEntry, value: string) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleGenerate = async () => {
    const valid = topics.filter(t => t.grade && t.subject && t.topicName.trim());
    if (valid.length === 0) {
      toast({ title: 'Missing Info', description: 'Please fill in at least one complete topic entry.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const payload = valid.map(t => ({
        grade: parseInt(t.grade.replace('Class ', '')),
        subject: t.subject,
        topicName: t.topicName.trim(),
      }));

      const { data, error } = await supabase.functions.invoke('visual-aid-design', {
        body: { topics: payload },
      });

      if (error) throw error;
      if (data?.results) {
        setResults(data.results);
      } else if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl: string, topic: string, grade: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `visual-aid-class${grade}-${topic.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const getComplexityLabel = (grade: number) => {
    if (grade <= 2) return { label: 'Basic', color: 'bg-success/15 text-success' };
    if (grade <= 5) return { label: 'Simple', color: 'bg-primary/15 text-primary' };
    if (grade <= 8) return { label: 'Moderate', color: 'bg-accent/15 text-accent-foreground' };
    return { label: 'Advanced', color: 'bg-destructive/15 text-destructive' };
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
            <Image className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="page-header">Visual Aid Design</h1>
            <p className="text-muted-foreground">Generate grade-appropriate educational diagrams with AI</p>
          </div>
        </div>

        {/* Input Section */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Enter Topics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add topics for different grades — images will be generated simultaneously with complexity matching the grade level.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics.map((topic, idx) => (
              <div
                key={topic.id}
                className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full gradient-primary text-primary-foreground text-sm font-bold shrink-0 self-start sm:self-center">
                  {idx + 1}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Grade</Label>
                    <Select value={topic.grade} onValueChange={v => updateTopic(topic.id, 'grade', v)}>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>
                        {grades.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                    <Select value={topic.subject} onValueChange={v => updateTopic(topic.id, 'subject', v)}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Topic Name</Label>
                    <Input
                      placeholder="e.g. Water Cycle, Photosynthesis"
                      value={topic.topicName}
                      onChange={e => updateTopic(topic.id, 'topicName', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTopic(topic.id)}
                  disabled={topics.length <= 1}
                  className="shrink-0 self-start sm:self-center text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={addTopic} className="gap-2">
                <Plus className="h-4 w-4" /> Add Another Topic
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary-gradient gap-2 sm:ml-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loading ? 'Generating...' : 'Generate Visual Aids'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.filter(t => t.grade && t.subject && t.topicName.trim()).map(t => (
              <Card key={t.id} className="card-elevated overflow-hidden">
                <div className="aspect-square bg-muted/50 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium">Generating for {t.grade}...</p>
                  <p className="text-xs text-muted-foreground">{t.topicName}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Generated Visual Aids
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result, idx) => {
                const complexity = getComplexityLabel(result.grade);
                return (
                  <Card key={idx} className="card-elevated overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{result.topic}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Class {result.grade} · {result.subject}
                          </p>
                        </div>
                        <span className={`badge-grade text-xs ${complexity.color}`}>
                          {complexity.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {result.error ? (
                        <div className="aspect-square rounded-lg bg-destructive/5 flex flex-col items-center justify-center gap-2 p-6">
                          <AlertCircle className="h-8 w-8 text-destructive" />
                          <p className="text-sm text-destructive text-center">{result.error}</p>
                        </div>
                      ) : result.imageUrl ? (
                        <div className="space-y-3">
                          <div className="rounded-lg overflow-hidden border bg-muted/20">
                            <img
                              src={result.imageUrl}
                              alt={`Visual aid for ${result.topic} - Class ${result.grade}`}
                              className="w-full h-auto"
                            />
                          </div>
                          {result.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {result.description}
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => downloadImage(result.imageUrl!, result.topic, result.grade)}
                          >
                            <Download className="h-4 w-4" /> Download
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
