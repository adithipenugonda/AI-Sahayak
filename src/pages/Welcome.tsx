import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Welcome() {
  const features = [
    { icon: Users, title: 'Student Management', desc: 'Track admissions, records & performance' },
    { icon: BookOpen, title: 'AI Lesson Planner', desc: 'Generate lesson plans instantly' },
    { icon: Brain, title: 'Smart Tools', desc: 'Quizzes, worksheets & story generator' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">AI Sahayak</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/auth">
            <Button size="sm" className="btn-primary-gradient">Sign In with Google</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary mx-auto shadow-lg shadow-primary/25">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Empowering <span className="bg-gradient-to-r from-primary to-[hsl(32,90%,55%)] bg-clip-text text-transparent">Rural Education</span> with AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            AI Sahayak helps teachers manage students, generate lesson plans, create quizzes, and build engaging stories — all powered by AI.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link to="/auth">
              <Button size="lg" className="btn-primary-gradient gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl w-full">
          {features.map((f) => (
            <div key={f.title} className="card-elevated p-6 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t">
        AI Sahayak — Empowering Rural Education
      </footer>
    </div>
  );
}
