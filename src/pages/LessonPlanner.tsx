import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen, Plus, Trash2, Loader2, CalendarDays, Lightbulb, GraduationCap, Layers, Sparkles, Merge, FileText, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const GRADES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Environmental Studies (EVS)', 'Computer Science', 'Sanskrit',
  'General Knowledge', 'Art & Craft', 'Physical Education', 'Other',
];

interface SyllabusEntry {
  id: string;
  grade: string;
  subject: string;
  content: string;
}

interface GradeInvolved {
  grade: string;
  chapter: string;
  topic: string;
}

interface ActivityByGrade {
  grade: string;
  activity: string;
}

interface MergedTopic {
  theme: string;
  grades_involved: GradeInvolved[];
  why_mergeable: string;
  lesson_plan: {
    duration: string;
    introduction: string;
    activities_by_grade: ActivityByGrade[];
    assessment: string;
  };
}

interface SeparateTopic {
  grade: string;
  chapter: string;
  topic: string;
  parallel_activity: string;
  suggestion: string;
}

interface ScheduleSlot {
  day: string;
  slot: string;
  type: string;
  details: string;
}

interface LessonPlanResult {
  merged_topics?: MergedTopic[];
  separate_topics?: SeparateTopic[];
  weekly_schedule?: ScheduleSlot[];
  tips?: string[];
  raw_response?: string;
}

export default function LessonPlanner() {
  const [syllabi, setSyllabi] = useState<SyllabusEntry[]>([
    { id: '1', grade: '', subject: '', content: '' },
    { id: '2', grade: '', subject: '', content: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LessonPlanResult | null>(null);

  const addGrade = () => {
    setSyllabi(prev => [...prev, { id: Date.now().toString(), grade: '', subject: '', content: '' }]);
  };

  const removeGrade = (id: string) => {
    if (syllabi.length <= 2) {
      toast.error('You need at least 2 grades for multigrade planning');
      return;
    }
    setSyllabi(prev => prev.filter(s => s.id !== id));
  };

  const updateField = (id: string, field: keyof SyllabusEntry, value: string) => {
    setSyllabi(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGenerate = async () => {
    const valid = syllabi.every(s => s.grade && s.subject && s.content.trim());
    if (!valid) {
      toast.error('Please select grade, subject, and enter chapters for all entries');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('lesson-planner', {
        body: { syllabi: syllabi.map(s => ({ grade: s.grade, subject: s.subject, content: s.content })) },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      toast.success('Multigrade lesson plan generated!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate lesson plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
            <Layers className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-header">Multigrade Lesson Planner</h1>
            <p className="text-muted-foreground mt-1">
              Merge similar topics across grades for efficient multigrade teaching
            </p>
          </div>
        </div>

        {/* How it works */}
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How it works</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select the <strong>grade</strong> and <strong>subject</strong> for each class sitting together.</li>
                  <li>Paste or type the chapter list / syllabus for each grade.</li>
                  <li>AI merges similar topics (e.g. "Plants" in Class 1 + "Photosynthesis" in Class 7) into combined lessons.</li>
                  <li>Get a <strong>merged syllabus</strong> with differentiated activities, plus a <strong>separate syllabus</strong> with parallel activities for non-overlapping topics.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <GraduationCap className="h-5 w-5 text-primary" />
              Enter Syllabi by Grade
            </h2>
            <Button variant="outline" size="sm" onClick={addGrade} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Grade
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {syllabi.map((entry, i) => (
              <Card key={entry.id} className="card-elevated relative overflow-hidden">
                {/* Color accent strip */}
                <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {i + 1}
                      </span>
                      Grade Entry
                    </CardTitle>
                    {syllabi.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeGrade(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Grade & Subject selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Grade</Label>
                      <Select value={entry.grade} onValueChange={v => updateField(entry.id, 'grade', v)}>
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Subject</Label>
                      <Select value={entry.subject} onValueChange={v => updateField(entry.id, 'subject', v)}>
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Chapter input */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      Chapters / Syllabus
                    </Label>
                    <Textarea
                      placeholder={`Paste or type chapters here:\n\nChapter 1: Plants Around Us\nChapter 2: Animals and Their Homes\nChapter 3: Food We Eat\n...`}
                      value={entry.content}
                      onChange={e => updateField(entry.id, 'content', e.target.value)}
                      className="input-field min-h-[160px] text-sm leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              size="lg"
              className="btn-primary-gradient rounded-xl px-10 py-6 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing & Merging Syllabi…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Multigrade Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── RESULTS ─── */}
        {result && (
          <div className="space-y-8">
            <Separator className="my-2" />

            {/* ── Merged Syllabus ── */}
            {result.merged_topics && result.merged_topics.length > 0 && (
              <div className="space-y-4">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <Merge className="h-5 w-5 text-success" />
                  Merged Syllabus — Teach Together
                </h2>
                <p className="text-sm text-muted-foreground -mt-2">
                  These topics share common themes across grades and can be taught in a single session with differentiated activities.
                </p>
                <div className="grid gap-5">
                  {result.merged_topics.map((topic, i) => (
                    <Card key={i} className="card-elevated overflow-hidden">
                      <div className="h-1 bg-success" />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success text-xs font-bold">{i + 1}</span>
                              {topic.theme}
                            </CardTitle>
                            <CardDescription className="mt-1.5">{topic.why_mergeable}</CardDescription>
                          </div>
                          <Badge className="bg-success/15 text-success border-success/30 shrink-0">Merged</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {topic.grades_involved.map((g, j) => (
                            <Badge key={j} variant="outline" className="text-xs py-1">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {g.grade}: {g.chapter} → {g.topic}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/40 rounded-xl p-5 space-y-4 border border-border/50">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Lesson Plan · {topic.lesson_plan.duration}
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium text-foreground">Introduction:</span>
                              <p className="text-muted-foreground mt-0.5">{topic.lesson_plan.introduction}</p>
                            </div>
                            <div>
                              <span className="font-medium text-foreground block mb-2">Activities by Grade:</span>
                              <div className="space-y-2">
                                {topic.lesson_plan.activities_by_grade.map((a, k) => (
                                  <div key={k} className="flex gap-2 items-start bg-background/60 rounded-lg p-3 border border-border/40">
                                    <Badge variant="secondary" className="shrink-0 text-xs mt-0.5">{a.grade}</Badge>
                                    <span className="text-muted-foreground">{a.activity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Assessment:</span>
                              <p className="text-muted-foreground mt-0.5">{topic.lesson_plan.assessment}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Separate Syllabus ── */}
            {result.separate_topics && result.separate_topics.length > 0 && (
              <div className="space-y-4">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <FileText className="h-5 w-5 text-accent" />
                  Separate Syllabus — Teach Independently
                </h2>
                <p className="text-sm text-muted-foreground -mt-2">
                  These topics are unique to each grade. While one grade is being taught, the other grade does a parallel activity.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {result.separate_topics.map((topic, i) => (
                    <Card key={i} className="card-elevated overflow-hidden">
                      <div className="h-1 bg-accent" />
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-accent/30 text-accent">{topic.grade}</Badge>
                          <span className="font-medium text-sm text-foreground">{topic.chapter}: {topic.topic}</span>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3 border border-border/40 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Teaching Plan:</span> {topic.suggestion}
                          </p>
                          {topic.parallel_activity && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Parallel Activity (other grades):</span> {topic.parallel_activity}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Weekly Schedule ── */}
            {result.weekly_schedule && result.weekly_schedule.length > 0 && (
              <div className="space-y-4">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Suggested Weekly Schedule
                </h2>
                <Card className="card-elevated overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left p-3 rounded-tl-lg">Day</th>
                          <th className="text-left p-3">Slot</th>
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3 rounded-tr-lg">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.weekly_schedule.map((slot, i) => (
                          <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">{slot.day}</td>
                            <td className="p-3 text-muted-foreground">{slot.slot}</td>
                            <td className="p-3">
                              <Badge
                                variant={slot.type === 'merged' ? 'default' : 'secondary'}
                                className={slot.type === 'merged' ? 'bg-success/15 text-success border-success/30' : ''}
                              >
                                {slot.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{slot.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ── Tips ── */}
            {result.tips && result.tips.length > 0 && (
              <Card className="card-elevated overflow-hidden">
                <div className="h-1 gradient-primary" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Tips for Your Multigrade Classroom
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary font-bold shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Raw fallback */}
            {result.raw_response && (
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{result.raw_response}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
