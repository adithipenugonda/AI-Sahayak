import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Sparkles, BookOpen, Copy, Loader2, ImageIcon, MessageCircleQuestion, BookMarked, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const subjects = ['General / Moral', 'Math', 'Science', 'Social Studies', 'Environmental Studies', 'Hindi', 'English'];
const lengths = ['Short', 'Medium', 'Long'];
const languages = ['', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Odia', 'Punjabi', 'Urdu'];

export default function StoryGenerator() {
  const { toast } = useToast();
  const [className, setClassName] = useState('');
  const [topic, setTopic] = useState('');
  const [subjectIntegration, setSubjectIntegration] = useState('');
  const [length, setLength] = useState('Medium');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!className) {
      toast({ title: 'Missing Fields', description: 'Please select a class.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setStoryContent('');
    setImages([]);
    try {
      const { data, error } = await supabase.functions.invoke('story-generator', {
        body: { className, topic, subjectIntegration, length, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStoryContent(data.content || '');
      setImages(data.images || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to generate story.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storyContent);
    toast({ title: 'Copied!', description: 'Story copied to clipboard.' });
  };

  const parseSection = (text: string, heading: string): string => {
    const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseScene = (text: string, sceneNum: number) => {
    const sceneRegex = new RegExp(`## Scene ${sceneNum}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
    const sceneMatch = text.match(sceneRegex);
    if (!sceneMatch) return { imageDesc: '', story: '' };
    const sceneText = sceneMatch[1];
    const imgMatch = sceneText.match(/### Image Description\s*\n([^\n#]+)/i);
    const storyMatch = sceneText.match(/### Story\s*\n([\s\S]*?)$/i);
    return {
      imageDesc: imgMatch ? imgMatch[1].trim() : '',
      story: storyMatch ? storyMatch[1].trim() : '',
    };
  };

  const renderResult = () => {
    if (!storyContent) return null;

    const title = parseSection(storyContent, 'Title');
    const moral = parseSection(storyContent, 'Moral of the Story');
    const vocabulary = parseSection(storyContent, 'Vocabulary');
    const questions = parseSection(storyContent, 'Comprehension Questions');
    const scenes = [1, 2, 3].map(n => ({ ...parseScene(storyContent, n), image: images[n - 1] || '' }));

    return (
      <div className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title || 'Generated Story'}</h2>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
        </div>

        {scenes.map((scene, i) => (
          <Card key={i} className="card-elevated overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Scene {i + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scene.image && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={scene.image} alt={`Scene ${i + 1}`} className="w-full max-h-80 object-contain bg-muted" />
                </div>
              )}
              {!scene.image && scene.imageDesc && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span className="italic">{scene.imageDesc}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{scene.story}</div>
            </CardContent>
          </Card>
        ))}

        {moral && (
          <Card className="card-elevated border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Moral of the Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium leading-relaxed">{moral}</p>
            </CardContent>
          </Card>
        )}

        {vocabulary && (
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-primary" />
                Vocabulary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{vocabulary}</div>
            </CardContent>
          </Card>
        )}

        {questions && (
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5 text-primary" />
                Comprehension Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{questions}</div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20">
            <Sparkles className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="page-header">Story Generator</h1>
            <p className="text-muted-foreground">Create illustrated educational stories with rural settings</p>
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
                <Label>Topic (optional)</Label>
                <Input placeholder="e.g., Photosynthesis, Fractions, Water Cycle" value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subject Integration (optional)</Label>
                <Select value={subjectIntegration} onValueChange={setSubjectIntegration}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Story Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Local Language (optional)</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="None (English only)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (English only)</SelectItem>
                    {languages.filter(Boolean).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Story & Images...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Story</>
              )}
            </Button>
            {loading && (
              <p className="text-xs text-muted-foreground text-center">This may take a minute as we generate illustrations for each scene...</p>
            )}
          </CardContent>
        </Card>

        {renderResult()}
      </div>
    </MainLayout>
  );
}
