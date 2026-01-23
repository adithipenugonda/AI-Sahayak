import { MainLayout } from '@/components/layout/MainLayout';
import { FileSpreadsheet } from 'lucide-react';

export default function WorksheetGenerator() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
            <FileSpreadsheet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="page-header">Worksheet Generator</h1>
            <p className="text-muted-foreground">Create printable practice worksheets</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Generate subject-wise worksheets with exercises and activities</p>
        </div>
      </div>
    </MainLayout>
  );
}
