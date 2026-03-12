import { useEffect, useState } from 'react';
import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import Header from '@/components/layout/Header';
import OrgSelector from '@/components/dashboard/OrgSelector';
import CTAButtons from '@/components/dashboard/CTAButtons';
import CompanyTable from '@/components/dashboard/CompanyTable';
import ActionBar from '@/components/dashboard/ActionBar';
import ArchivedBanner from '@/components/dashboard/ArchivedBanner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const isOrgArchived = (org: { name: string; status?: string } | null) => {
  if (!org) return false;
  if (org.status) return org.status === 'archived';
  return org.name.toLowerCase().includes('legacy');
};

const Dashboard = () => {
  const selectedOrg = useStore(s => s.selectedOrg);
  const setCompanies = useStore(s => s.setCompanies);
  const companies = useStore(s => s.companies);
  const isGenerating = useStore(s => s.isGenerating);
  const [isLoading, setIsLoading] = useState(false);

  const archived = isOrgArchived(selectedOrg);

  const loadCompanies = async () => {
    if (!selectedOrg) return;
    setIsLoading(true);
    try {
      const res = await api.getOrgCompanies(selectedOrg.id);
      setCompanies(res.companies);
    } catch (e) {
      console.error('Failed to load companies:', e);
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) loadCompanies();
  }, [selectedOrg]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6 pb-32">
        <OrgSelector />

        {selectedOrg && archived && <ArchivedBanner />}

        {!archived && <CTAButtons />}

        {selectedOrg && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Companies & POCs</h2>
              <Button variant="ghost" size="sm" onClick={loadCompanies} disabled={isGenerating || isLoading}>
                {(isGenerating || isLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1">Refresh</span>
              </Button>
            </div>

            {isGenerating || isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent mb-3" />
                <p className="font-medium text-foreground">{isGenerating ? 'Generating leads...' : 'Loading companies...'}</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
              </div>
            ) : (
              <CompanyTable />
            )}
          </div>
        )}
      </main>
      {!archived && <ActionBar />}
    </div>
  );
};

export default Dashboard;
