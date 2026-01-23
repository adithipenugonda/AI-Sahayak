import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen } from 'lucide-react';

export default function LessonPlanner() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-header">Smart Lesson Planner</h1>
            <p className="text-muted-foreground">AI-powered lesson planning assistant</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Generate comprehensive lesson plans tailored to your curriculum</p>
        </div>
      </div>
    </MainLayout>
  );
}
