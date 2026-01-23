import { MainLayout } from '@/components/layout/MainLayout';
import { FileQuestion } from 'lucide-react';

export default function QuestionPaperGenerator() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
            <FileQuestion className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="page-header">Question Paper Generator</h1>
            <p className="text-muted-foreground">Generate exam question papers</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Create balanced question papers following exam patterns</p>
        </div>
      </div>
    </MainLayout>
  );
}
