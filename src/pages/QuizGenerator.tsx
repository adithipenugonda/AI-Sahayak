import { MainLayout } from '@/components/layout/MainLayout';
import { HelpCircle } from 'lucide-react';

export default function QuizGenerator() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
            <HelpCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <h1 className="page-header">Quiz Generator</h1>
            <p className="text-muted-foreground">Generate interactive quizzes for students</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Create MCQs, true/false, and fill-in-the-blank questions</p>
        </div>
      </div>
    </MainLayout>
  );
}
