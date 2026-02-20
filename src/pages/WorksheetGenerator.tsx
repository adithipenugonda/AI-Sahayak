import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileSpreadsheet, Plus, Trash2, Loader2, Printer, Copy, Eye, EyeOff, Lightbulb, Star, BookOpen, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUBJECTS = ['Science', 'Mathematics', 'English', 'Social Studies', 'Hindi', 'Environmental Studies (EVS)', 'General Knowledge'];
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const DURATIONS = [10, 15, 20, 25, 30];

interface TopicEntry {
  id: string;
  grade: string;
  subject: string;
  topic: string;
  duration: string;
}

interface WorksheetQuestion {
  number: number;
  type: string;
  question: string;
  answer: string;
  pairs?: { left: string; right: string }[];
}

interface WorksheetData {
  title: string;
  subject: string;
  topic: string;
  duration: string;
  grades: string;
  warm_up: { question: string; type: string; answer: string };
  level_1: { label: string; questions: WorksheetQuestion[] };
  level_2: { label: string; questions: WorksheetQuestion[] };
  level_3: { label: string; questions: WorksheetQuestion[] };
  answer_key: { section: string; answer?: string; answers?: string[] }[];
  explanations: { question_ref: string; explanation: string }[];
}

interface GeneratedWorksheet {
  entry: TopicEntry;
  data: WorksheetData;
}

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    fill_in_the_blanks: 'Fill in the Blanks',
    short_answer: 'Short Answer',
    match_the_following: 'Match the Following',
    problem_solving: 'Problem Solving',
  };
  return map[t] || t;
};

const typeBadgeColor = (t: string) => {
  const map: Record<string, string> = {
    fill_in_the_blanks: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    short_answer: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    match_the_following: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    problem_solving: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  };
  return map[t] || '';
};

export default function WorksheetGenerator() {
  const [entries, setEntries] = useState<TopicEntry[]>([
    { id: crypto.randomUUID(), grade: '', subject: '', topic: '', duration: '20' },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedWorksheet[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);

  const addEntry = () => setEntries(prev => [...prev, { id: crypto.randomUUID(), grade: '', subject: '', topic: '', duration: '20' }]);
  const removeEntry = (id: string) => setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  const updateEntry = (id: string, field: keyof TopicEntry, value: string) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const generate = async () => {
    const valid = entries.filter(e => e.grade && e.subject && e.topic.trim());
    if (valid.length === 0) { toast.error('Please fill in at least one complete entry.'); return; }
    setLoading(true);
    setResults([]);
    try {
      const promises = valid.map(async entry => {
        const { data, error } = await supabase.functions.invoke('worksheet-generator', {
          body: { subject: entry.subject, topic: entry.topic.trim(), grades: [Number(entry.grade)], duration: Number(entry.duration) },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        return { entry, data: data.worksheet as WorksheetData };
      });
      const res = await Promise.all(promises);
      setResults(res);
      toast.success(`${res.length} worksheet(s) generated!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate worksheets.');
    } finally {
      setLoading(false);
    }
  };

  const copyWorksheet = (ws: WorksheetData) => {
    let text = `📝 ${ws.title}\n📚 ${ws.subject} | ⏱ ${ws.duration}\n${ws.grades}\n\n`;
    text += `⭐ WARM-UP\n${ws.warm_up.question}\n\n`;
    const levels = [ws.level_1, ws.level_2, ws.level_3];
    levels.forEach(level => {
      text += `${level.label}\n`;
      level.questions.forEach(q => {
        text += `${q.number}. [${typeLabel(q.type)}] ${q.question}\n`;
        if (q.pairs) q.pairs.forEach(p => { text += `   ${p.left} → ${p.right}\n`; });
      });
      text += '\n';
    });
    text += '📋 ANSWER KEY\n';
    ws.answer_key.forEach(ak => {
      text += `${ak.section}: ${ak.answer || ak.answers?.join(', ') || ''}\n`;
    });
    text += '\n💡 EXPLANATIONS\n';
    ws.explanations.forEach(ex => { text += `${ex.question_ref}: ${ex.explanation}\n`; });
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const printWorksheet = () => {
    setShowAnswers(true);
    setTimeout(() => window.print(), 300);
  };

  const renderQuestion = (q: WorksheetQuestion) => (
    <div key={q.number} className="p-4 rounded-lg border border-border/50 bg-background/50">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">{q.number}</span>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColor(q.type)}`}>{typeLabel(q.type)}</span>
          </div>
          <p className="text-sm leading-relaxed">{q.question}</p>
          {q.pairs && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {q.pairs.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{p.left}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{p.right}</span>
                </div>
              ))}
            </div>
          )}
          {showAnswers && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Answer: {q.answer}</p>}
        </div>
      </div>
    </div>
  );

  const levelIcon = (idx: number) => {
    if (idx === 0) return <BookOpen className="h-5 w-5" />;
    if (idx === 1) return <Star className="h-5 w-5" />;
    return <Rocket className="h-5 w-5" />;
  };

  const levelColor = (idx: number) => {
    if (idx === 0) return 'border-l-emerald-500';
    if (idx === 1) return 'border-l-amber-500';
    return 'border-l-rose-500';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
            <FileSpreadsheet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="page-header">Worksheet Generator</h1>
            <p className="text-muted-foreground">Create printable multi-level practice worksheets</p>
          </div>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Worksheet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Entry {idx + 1}</span>
                  {entries.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Grade</Label>
                    <Select value={entry.grade} onValueChange={v => updateEntry(entry.id, 'grade', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                      <SelectContent>{GRADES.map(g => <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subject</Label>
                    <Select value={entry.subject} onValueChange={v => updateEntry(entry.id, 'subject', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Topic</Label>
                    <Input placeholder="e.g. Plants, Fractions" value={entry.topic} onChange={e => updateEntry(entry.id, 'topic', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duration</Label>
                    <Select value={entry.duration} onValueChange={v => updateEntry(entry.id, 'duration', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={addEntry}>
                <Plus className="h-4 w-4 mr-1" /> Add Another Topic
              </Button>
              <Button onClick={generate} disabled={loading} className="ml-auto">
                {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : <><FileSpreadsheet className="h-4 w-4 mr-1" /> Generate Worksheets</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Generated Worksheets</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAnswers(p => !p)}>
                  {showAnswers ? <><EyeOff className="h-4 w-4 mr-1" /> Hide Answers</> : <><Eye className="h-4 w-4 mr-1" /> Show Answers</>}
                </Button>
              </div>
            </div>

            {results.map((res, rIdx) => (
              <Card key={rIdx} className="overflow-hidden print:shadow-none print:border">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 print:bg-transparent">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">{res.data.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{res.data.subject}</Badge>
                        <Badge variant="outline">{res.data.grades}</Badge>
                        <Badge variant="outline">⏱ {res.data.duration}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5 print:hidden">
                      <Button variant="ghost" size="icon" onClick={() => copyWorksheet(res.data)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={printWorksheet}><Printer className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Warm-up */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-semibold text-amber-700 dark:text-amber-300">Warm-Up (All Students)</h3>
                    </div>
                    <p className="text-sm">{res.data.warm_up.question}</p>
                    {showAnswers && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Answer: {res.data.warm_up.answer}</p>}
                  </div>

                  {/* Levels */}
                  {[res.data.level_1, res.data.level_2, res.data.level_3].map((level, lIdx) => (
                    <div key={lIdx} className={`border-l-4 ${levelColor(lIdx)} pl-4 space-y-3`}>
                      <div className="flex items-center gap-2">
                        {levelIcon(lIdx)}
                        <h3 className="font-semibold">{level.label}</h3>
                      </div>
                      <div className="grid gap-3">
                        {level.questions.map(renderQuestion)}
                      </div>
                    </div>
                  ))}

                  {/* Answer Key (print or toggled) */}
                  {showAnswers && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                      <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">📋 Answer Key</h3>
                      {res.data.answer_key.map((ak, i) => (
                        <div key={i}>
                          <span className="text-sm font-medium">{ak.section}:</span>
                          <span className="text-sm ml-2">{ak.answer || ak.answers?.join(' | ')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanations */}
                  {showAnswers && res.data.explanations?.length > 0 && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300">Explanations</h3>
                      </div>
                      {res.data.explanations.map((ex, i) => (
                        <p key={i} className="text-sm"><span className="font-medium">{ex.question_ref}:</span> {ex.explanation}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
