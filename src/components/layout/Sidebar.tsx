import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList, 
  FileText,
  GraduationCap,
  BookOpen,
  Image,
  HelpCircle,
  FileSpreadsheet,
  FileQuestion,
  Brain,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const studentNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'All Students', path: '/students' },
  { icon: UserPlus, label: 'Add Student', path: '/students/new' },
  { icon: ClipboardList, label: 'Record Marks', path: '/marks' },
  { icon: FileText, label: 'Report Cards', path: '/reports' },
];

const aiToolsNavItems = [
  { icon: BookOpen, label: 'Lesson Planner', path: '/lesson-planner' },
  { icon: Image, label: 'Visual Aid Design', path: '/visual-aid' },
  { icon: HelpCircle, label: 'Quiz Generator', path: '/quiz-generator' },
  { icon: FileSpreadsheet, label: 'Worksheet Generator', path: '/worksheet-generator' },
  { icon: FileQuestion, label: 'Question Paper', path: '/question-paper' },
  { icon: Brain, label: 'Knowledge Base', path: '/knowledge-base' },
  { icon: Sparkles, label: 'Story Generator', path: '/story-generator' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">AI Sahayak</h1>
            <p className="text-xs text-muted-foreground">Student Management</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Student Management
        </p>
        {studentNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-sidebar-border" />

        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          AI Tools
        </p>
        {aiToolsNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <p className="text-xs text-center text-muted-foreground">
          Empowering Rural Education
        </p>
      </div>
    </aside>
  );
}
