import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen, Plus, Trash2, Upload, Loader2, Merge, CalendarDays, Lightbulb, GraduationCap, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SyllabusEntry {
  id: string;
  grade: string;
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
    { id: '1', grade: '', content: '' },
    { id: '2', grade: '', content: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LessonPlanResult | null>(null);

  const addGrade = () => {
    setSyllabi(prev => [...prev, { id: Date.now().toString(), grade: '', content: '' }]);
  };

  const removeGrade = (id: string) => {
    if (syllabi.length <= 2) {
      toast.error('You need at least 2 grades for multigrade planning');
      return;
    }
    setSyllabi(prev => prev.filter(s => s.id !== id));
  };

  const updateSyllabus = (id: string, field: 'grade' | 'content', value: string) => {
    setSyllabi(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGenerate = async () => {
    const valid = syllabi.every(s => s.grade.trim() && s.content.trim());
    if (!valid) {
      toast.error('Please fill in grade name and syllabus content for all entries');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('lesson-planner', {
        body: { syllabi: syllabi.map(s => ({ grade: s.grade, content: s.content })) },
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
              AI-powered lesson planning for multigrade classrooms — merge similar topics across grades
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
                <p>1. Enter the syllabus/chapter list for each grade in your multigrade classroom.</p>
                <p>2. AI finds similar topics that can be taught together (e.g., "Plants" in Class 1 + "Photosynthesis" in Class 3).</p>
                <p>3. Get a merged lesson plan with differentiated activities for each grade level, plus a weekly schedule.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <GraduationCap className="h-5 w-5 text-primary" />
              Enter Syllabi by Grade
            </h2>
            <Button variant="outline" size="sm" onClick={addGrade}>
              <Plus className="h-4 w-4 mr-1" /> Add Grade
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {syllabi.map((entry, i) => (
              <Card key={entry.id} className="card-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Grade {i + 1}</CardTitle>
                    {syllabi.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeGrade(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor={`grade-${entry.id}`}>Class / Grade Name</Label>
                    <Input
                      id={`grade-${entry.id}`}
                      placeholder="e.g., Class 1, Grade 3, etc."
                      value={entry.grade}
                      onChange={e => updateSyllabus(entry.id, 'grade', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`content-${entry.id}`}>Syllabus / Chapter List</Label>
                    <Textarea
                      id={`content-${entry.id}`}
                      placeholder={`Enter chapters/topics for this grade:\n\nChapter 1: Plants\nChapter 2: Animals\nChapter 3: Water Cycle\n...`}
                      value={entry.content}
                      onChange={e => updateSyllabus(entry.id, 'content', e.target.value)}
                      className="mt-1 min-h-[180px]"
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
              className="btn-primary-gradient rounded-xl px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing & Merging Syllabi...
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

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <Separator />

            {/* Merged Topics */}
            {result.merged_topics && result.merged_topics.length > 0 && (
              <div className="space-y-4">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <Merge className="h-5 w-5 text-success" />
                  Merged Topics — Teach Together
                </h2>
                <div className="grid gap-4">
                  {result.merged_topics.map((topic, i) => (
                    <Card key={i} className="card-elevated border-l-4 border-l-success">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg">{topic.theme}</CardTitle>
                            <CardDescription className="mt-1">{topic.why_mergeable}</CardDescription>
                          </div>
                          <Badge className="bg-success/15 text-success shrink-0">Mergeable</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {topic.grades_involved.map((g, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {g.grade}: {g.chapter} — {g.topic}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Lesson Plan ({topic.lesson_plan.duration})
                          </div>
                          <p className="text-sm"><span className="font-medium">Introduction:</span> {topic.lesson_plan.introduction}</p>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Activities by Grade:</p>
                            {topic.lesson_plan.activities_by_grade.map((a, k) => (
                              <div key={k} className="flex gap-2 text-sm">
                                <Badge variant="secondary" className="shrink-0 text-xs">{a.grade}</Badge>
                                <span>{a.activity}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm"><span className="font-medium">Assessment:</span> {topic.lesson_plan.assessment}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Separate Topics */}
            {result.separate_topics && result.separate_topics.length > 0 && (
              <div className="space-y-4">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Separate Topics — Teach Independently
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.separate_topics.map((topic, i) => (
                    <Card key={i} className="card-elevated border-l-4 border-l-accent">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{topic.grade}</Badge>
                          <span className="font-medium text-sm">{topic.chapter}: {topic.topic}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{topic.suggestion}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Schedule */}
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
                          <th className="text-left p-3">Day</th>
                          <th className="text-left p-3">Slot</th>
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.weekly_schedule.map((slot, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="p-3 font-medium">{slot.day}</td>
                            <td className="p-3">{slot.slot}</td>
                            <td className="p-3">
                              <Badge variant={slot.type === 'merged' ? 'default' : 'secondary'} className="text-xs">
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

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <Card className="card-elevated border-l-4 border-l-primary">
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
                        <span className="text-primary font-bold">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Raw response fallback */}
            {result.raw_response && (
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap text-sm">{result.raw_response}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
