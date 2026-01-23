import { MainLayout } from '@/components/layout/MainLayout';
import { Brain } from 'lucide-react';

export default function KnowledgeBase() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
            <Brain className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="page-header">Instant Knowledge Base</h1>
            <p className="text-muted-foreground">Quick reference and information lookup</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Get instant answers to educational queries and concepts</p>
        </div>
      </div>
    </MainLayout>
  );
}
