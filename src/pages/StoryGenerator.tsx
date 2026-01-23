import { MainLayout } from '@/components/layout/MainLayout';
import { Sparkles } from 'lucide-react';

export default function StoryGenerator() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20">
            <Sparkles className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="page-header">Story Generator</h1>
            <p className="text-muted-foreground">Create educational stories for students</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Generate engaging stories with moral lessons and educational content</p>
        </div>
      </div>
    </MainLayout>
  );
}
