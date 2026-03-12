import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ActionBar = () => {
  const companies = useStore(s => s.companies);
  const selectedPocIds = useStore(s => s.selectedPocIds);
  const isEnriching = useStore(s => s.isEnriching);
  const setIsEnriching = useStore(s => s.setIsEnriching);
  const setCompanies = useStore(s => s.setCompanies);
  const setEmailPocIds = useStore(s => s.setEmailPocIds);
  const navigate = useNavigate();

  if (selectedPocIds.size === 0) return null;

  const allPocs = companies.flatMap(c => c.pocs);
  const selectedPocs = allPocs.filter(p => selectedPocIds.has(p.id));
  const enrichedPocs = selectedPocs.filter(p => p.enrichment_status === 'enriched');
  const notEnrichedPocs = selectedPocs.filter(p => p.enrichment_status === 'not_enriched');

  const selectedOrg = useStore(s => s.selectedOrg);

  const refreshCompanies = async () => {
    if (!selectedOrg) return;
    try {
      const res = await api.getOrgCompanies(selectedOrg.id);
      setCompanies(res.companies);
    } catch {
      // silent refresh failure
    }
  };

  const handleEnrich = async () => {
    const pocIds = notEnrichedPocs.map(p => p.id);
    if (pocIds.length === 0) return;
    setIsEnriching(true);
    try {
      const res = await api.post<any>('/api/pocs/enrich', { poc_ids: pocIds });
      toast.success(`Enrichment started for ${pocIds.length} POCs. Refreshing data...`);

      // Poll for updated data since enrichment is async
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 3000;

      const poll = async () => {
        attempts++;
        await refreshCompanies();
        
        // Check if enrichment data has arrived
        const updatedCompanies = useStore.getState().companies;
        const enrichedPocIds = new Set(pocIds);
        const allDone = updatedCompanies
          .flatMap(c => c.pocs)
          .filter(p => enrichedPocIds.has(p.id))
          .every(p => p.enrichment_status === 'enriched' || p.enrichment_status === 'failed');

        if (allDone) {
          toast.success('Enrichment complete — contact data updated.');
          setIsEnriching(false);
        } else if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          toast.info('Enrichment is still processing. Hit Refresh to check for updates.');
          setIsEnriching(false);
        }
      };

      setTimeout(poll, pollInterval);
    } catch {
      toast.error('Enrichment failed.');
      setIsEnriching(false);
    }
  };

  const handleCompose = () => {
    if (enrichedPocs.length === 0) {
      toast.warning('Please enrich contacts first before composing emails.');
      return;
    }
    setEmailPocIds(enrichedPocs.map(p => p.id));
    navigate('/emails');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 action-bar-enter">
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">Selected: {selectedPocs.length} POCs</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {enrichedPocs.length} enriched (ready to email) • {notEnrichedPocs.length} not enriched
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {notEnrichedPocs.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnrich}
                disabled={isEnriching}
              >
                {isEnriching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Enrich {notEnrichedPocs.length} POCs (~{notEnrichedPocs.length} credits)
              </Button>
            )}
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleCompose}
              disabled={enrichedPocs.length === 0}
            >
              <Mail className="h-4 w-4 mr-1" />
              Compose Emails
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
