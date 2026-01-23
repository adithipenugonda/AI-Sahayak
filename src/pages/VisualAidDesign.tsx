import { MainLayout } from '@/components/layout/MainLayout';
import { Image } from 'lucide-react';

export default function VisualAidDesign() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
            <Image className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="page-header">Visual Aid Design</h1>
            <p className="text-muted-foreground">Create engaging visual learning materials</p>
          </div>
        </div>
        <div className="card-elevated p-8 text-center">
          <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Design charts, diagrams, and infographics for your lessons</p>
        </div>
      </div>
    </MainLayout>
  );
}
