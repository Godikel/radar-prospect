import Header from '@/components/layout/Header';
import { BarChart3 } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">Dashboard coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Analytics and insights about your lead generation, outreach performance, and email metrics will appear here.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
