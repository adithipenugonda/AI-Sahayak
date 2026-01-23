import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import StudentDetail from "./pages/StudentDetail";
import RecordMarks from "./pages/RecordMarks";
import Reports from "./pages/Reports";
import LessonPlanner from "./pages/LessonPlanner";
import VisualAidDesign from "./pages/VisualAidDesign";
import QuizGenerator from "./pages/QuizGenerator";
import WorksheetGenerator from "./pages/WorksheetGenerator";
import QuestionPaperGenerator from "./pages/QuestionPaperGenerator";
import KnowledgeBase from "./pages/KnowledgeBase";
import StoryGenerator from "./pages/StoryGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ai-sahayak-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<AddStudent />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/marks" element={<RecordMarks />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/lesson-planner" element={<LessonPlanner />} />
            <Route path="/visual-aid" element={<VisualAidDesign />} />
            <Route path="/quiz-generator" element={<QuizGenerator />} />
            <Route path="/worksheet-generator" element={<WorksheetGenerator />} />
            <Route path="/question-paper" element={<QuestionPaperGenerator />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/story-generator" element={<StoryGenerator />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
