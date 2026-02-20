import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { HelpCircle, Sparkles, Loader2, BookOpen, CheckCircle2, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizQuestion {
  number: number;
  question: string;
  answer: string;
}

interface GradeQuestions {
  grade: number;
  difficulty: string;
  questions: QuizQuestion[];
}

interface Quiz {
  common_question: { question: string; answer: string };
  grade_questions: GradeQuestions[];
}

const SUBJECTS = ['Science', 'Mathematics', 'English', 'Hindi', 'Social Studies', 'EVS', 'Geography', 'History', 'Civics', 'General Knowledge'];
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

const difficultyColor: Record<string, string> = {
  Easy: 'bg-success/15 text-success border-success/30',
  Medium: 'bg-accent/15 text-accent-foreground border-accent/30',
  'Slightly Difficult': 'bg-primary/15 text-primary border-primary/30',
  Difficult: 'bg-destructive/15 text-destructive border-destructive/30',
  Challenging: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function QuizGenerator() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const toggleGrade = (grade: number) => {
    setSelectedGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade].sort((a, b) => a - b)
    );
  };

  const generateQuiz = async () => {
    if (!subject || !topic || selectedGrades.length === 0) {
      toast.error('Please fill in subject, topic, and select at least one grade.');
      return;
    }

    setLoading(true);
    setQuiz(null);
    setShowAnswers(false);

    try {
      const { data, error } = await supabase.functions.invoke('quiz-generator', {
        body: { subject, topic, grades: selectedGrades },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.quiz) {
        setQuiz(data.quiz);
        toast.success('Quiz generated successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const copyQuiz = () => {
    if (!quiz) return;
    let text = `📝 QUIZ: ${subject} — ${topic}\n\n`;
    text += `★ COMMON QUESTION (All Grades)\nQ. ${quiz.common_question.question}\n\n`;
    quiz.grade_questions.forEach(gq => {
      text += `━━━ Grade ${gq.grade} (${gq.difficulty}) ━━━\n`;
      gq.questions.forEach(q => { text += `${q.number}. ${q.question}\n`; });
      text += '\n';
    });
    text += `━━━ ANSWER KEY ━━━\nCommon: ${quiz.common_question.answer}\n`;
    quiz.grade_questions.forEach(gq => {
      gq.questions.forEach(q => { text += `Grade ${gq.grade} Q${q.number}: ${q.answer}\n`; });
    });
    navigator.clipboard.writeText(text);
    toast.success('Quiz copied to clipboard!');
  };

  const printQuiz = () => window.print();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
            <HelpCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <h1 className="page-header">Quiz Generator</h1>
            <p className="text-muted-foreground">Generate multigrade classroom quizzes with AI</p>
          </div>
        </div>

        {/* Input Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Quiz Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g. Plants, Fractions, Solar System..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Grades (click to toggle)</Label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGrade(g)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      selectedGrades.includes(g)
                        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    Class {g}
                  </button>
                ))}
              </div>
              {selectedGrades.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedGrades.map(g => `Class ${g}`).join(', ')}
                </p>
              )}
            </div>

            <Button
              onClick={generateQuiz}
              disabled={loading || !subject || !topic || selectedGrades.length === 0}
              className="w-full btn-primary-gradient h-12 text-base"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating Quiz...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Generate Quiz</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quiz Output */}
        {quiz && (
          <div className="space-y-4 print:space-y-2" id="quiz-output">
            {/* Actions */}
            <div className="flex items-center justify-between print:hidden">
              <h2 className="text-xl font-bold text-foreground">
                📝 {subject} — {topic}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAnswers(!showAnswers)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </Button>
                <Button variant="outline" size="sm" onClick={copyQuiz}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={printQuiz}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              </div>
            </div>

            {/* Common Question */}
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">★</span>
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Common Question — All Grades</p>
                    <p className="text-foreground font-medium">{quiz.common_question.question}</p>
                    {showAnswers && (
                      <p className="mt-2 text-sm text-success font-medium bg-success/10 rounded-md px-3 py-1.5 inline-block">
                        Ans: {quiz.common_question.answer}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grade-wise Questions */}
            {quiz.grade_questions.map(gq => (
              <Card key={gq.grade} className="card-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Grade {gq.grade} Questions</CardTitle>
                    <Badge variant="outline" className={difficultyColor[gq.difficulty] || 'bg-muted text-muted-foreground'}>
                      {gq.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gq.questions.map(q => (
                    <div key={q.number} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-sm font-bold">
                        {q.number}
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground">{q.question}</p>
                        {showAnswers && (
                          <p className="mt-1.5 text-sm text-success font-medium">Ans: {q.answer}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Answer Key (print-only) */}
            <div className="hidden print:block mt-6 border-t pt-4">
              <h3 className="font-bold mb-2">Answer Key</h3>
              <p><strong>Common:</strong> {quiz.common_question.answer}</p>
              {quiz.grade_questions.map(gq => (
                <div key={gq.grade}>
                  <p className="font-semibold mt-1">Grade {gq.grade}:</p>
                  {gq.questions.map(q => (
                    <p key={q.number}>{q.number}. {q.answer}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
