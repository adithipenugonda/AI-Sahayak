import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileQuestion, Sparkles, Loader2, Printer, Copy, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  q_number: number;
  question: string;
  marks: number;
  type: string;
  options?: string[] | null;
  internal_choice?: string | null;
}

interface Section {
  section_id: string;
  section_title: string;
  section_instruction: string;
  questions: Question[];
}

interface PaperHeader {
  school_name: string;
  exam_title: string;
  class: string;
  subject: string;
  time: string;
  total_marks: number;
}

interface QuestionPaper {
  header: PaperHeader;
  general_instructions: string[];
  sections: Section[];
}

const SUBJECTS = ['Science', 'Mathematics', 'English', 'Hindi', 'Social Studies', 'EVS', 'Geography', 'History', 'Civics', 'General Knowledge', 'Physics', 'Chemistry', 'Biology'];
const EXAM_TYPES = ['Unit Test', 'Quarterly', 'Half-Yearly', 'Annual'];
const GRADES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const PAPER_TYPES = [
  { value: 'mixed', label: 'Mixed (MCQ + Short + Long + Fill blanks)', desc: 'Balanced paper with all question types' },
  { value: 'mcq', label: 'All MCQs', desc: 'Only multiple choice questions' },
  { value: 'fill_blanks', label: 'All Fill in the Blanks', desc: 'Only fill in the blank questions' },
  { value: 'short_answer', label: 'All Short Answer', desc: 'Only 2–3 mark questions' },
  { value: 'long_answer', label: 'All Long Answer', desc: 'Only descriptive questions' },
];

export default function QuestionPaperGenerator() {
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [duration, setDuration] = useState('');
  const [topics, setTopics] = useState('');
  const [paperType, setPaperType] = useState('mixed');
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(false);

  const canGenerate = schoolName && className && subject && examType && totalMarks && duration && topics && paperType;

  const generatePaper = async () => {
    if (!canGenerate) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setPaper(null);
    try {
      const { data, error } = await supabase.functions.invoke('question-paper', {
        body: { schoolName, className, subject, examType, totalMarks: Number(totalMarks), duration, topics, paperType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.paper) {
        setPaper(data.paper);
        toast.success('Question paper generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate question paper');
    } finally {
      setLoading(false);
    }
  };

  const copyPaper = () => {
    if (!paper) return;
    let text = `${paper.header.school_name}\n`;
    text += `${paper.header.exam_title}\n`;
    text += `Class: ${paper.header.class}  |  Subject: ${paper.header.subject}\n`;
    text += `Time: ${paper.header.time}  |  Max. Marks: ${paper.header.total_marks}\n\n`;
    text += `General Instructions:\n`;
    paper.general_instructions.forEach((inst, i) => { text += `${i + 1}. ${inst}\n`; });
    text += '\n';
    paper.sections.forEach(sec => {
      text += `${sec.section_title}\n${sec.section_instruction}\n\n`;
      sec.questions.forEach(q => {
        text += `Q${q.q_number}. ${q.question} [${q.marks} mark${q.marks > 1 ? 's' : ''}]\n`;
        if (q.options) q.options.forEach(o => { text += `    ${o}\n`; });
        if (q.internal_choice) text += `    OR\n    ${q.internal_choice}\n`;
        text += '\n';
      });
    });
    navigator.clipboard.writeText(text);
    toast.success('Question paper copied!');
  };

  const printPaper = () => window.print();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
            <FileQuestion className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="page-header">Question Paper Generator</h1>
            <p className="text-muted-foreground">Generate exam-ready question papers with AI</p>
          </div>
        </div>

        {/* Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              Paper Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input placeholder="e.g. Govt. High School, Rampur" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger><SelectValue placeholder="Select exam type" /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input type="number" placeholder="e.g. 80" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Time Duration</Label>
                <Input placeholder="e.g. 3 Hours" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <Label>Topic(s)</Label>
              <Input placeholder="e.g. Light, Reflection, Refraction" value={topics} onChange={e => setTopics(e.target.value)} />
              <p className="text-xs text-muted-foreground">Separate multiple topics with commas</p>
            </div>

            {/* Paper Type */}
            <div className="space-y-3">
              <Label>Question Paper Type</Label>
              <RadioGroup value={paperType} onValueChange={setPaperType} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAPER_TYPES.map(pt => (
                  <label
                    key={pt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paperType === pt.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={pt.value} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{pt.label}</p>
                      <p className="text-xs text-muted-foreground">{pt.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Button
              onClick={generatePaper}
              disabled={loading || !canGenerate}
              className="w-full btn-primary-gradient h-12 text-base"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating Question Paper...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Generate Question Paper</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Paper */}
        {paper && (
          <div className="space-y-0" id="question-paper-output">
            {/* Actions bar */}
            <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
              <Button variant="outline" size="sm" onClick={copyPaper}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={printPaper}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>

            {/* Exam Paper Card */}
            <Card className="border-2 border-foreground/20 bg-card shadow-lg print:shadow-none print:border">
              <CardContent className="p-6 md:p-10 space-y-6">
                {/* Paper Header */}
                <div className="text-center space-y-1 border-b-2 border-foreground/20 pb-4">
                  <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-foreground">
                    {paper.header.school_name}
                  </h2>
                  <p className="text-lg font-semibold text-foreground">{paper.header.exam_title}</p>
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm text-foreground mt-2">
                    <span><strong>Class:</strong> {paper.header.class}</span>
                    <span><strong>Subject:</strong> {paper.header.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-sm text-foreground mt-1 px-4">
                    <span><strong>Time:</strong> {paper.header.time}</span>
                    <span><strong>Max. Marks:</strong> {paper.header.total_marks}</span>
                  </div>
                </div>

                {/* General Instructions */}
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground underline">General Instructions:</p>
                  <ol className="list-decimal list-inside text-sm text-foreground space-y-0.5 pl-2">
                    {paper.general_instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                </div>

                {/* Sections */}
                {paper.sections.map(section => (
                  <div key={section.section_id} className="space-y-3">
                    <div className="border-b border-foreground/15 pb-1">
                      <h3 className="text-base font-bold text-foreground uppercase">{section.section_title}</h3>
                      <p className="text-xs text-muted-foreground italic">{section.section_instruction}</p>
                    </div>

                    <div className="space-y-4 pl-1">
                      {section.questions.map(q => (
                        <div key={q.q_number} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-semibold text-foreground shrink-0">Q{q.q_number}.</span>
                            <div className="flex-1">
                              <span className="text-sm text-foreground">{q.question}</span>
                              <span className="text-xs text-muted-foreground ml-2">[{q.marks}]</span>
                            </div>
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 pl-8 text-sm text-foreground">
                              {q.options.map((opt, oi) => (
                                <span key={oi}>{opt}</span>
                              ))}
                            </div>
                          )}
                          {q.internal_choice && (
                            <div className="pl-8 text-sm">
                              <span className="font-semibold text-muted-foreground">OR</span>
                              <p className="text-foreground">{q.internal_choice}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="text-center border-t border-foreground/15 pt-4 mt-6">
                  <p className="text-xs text-muted-foreground italic">— End of Question Paper —</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
