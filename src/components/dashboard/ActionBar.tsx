import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Search, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const POLL_INTERVAL = 10_000; // 10 seconds
const POLL_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const ActionBar = () => {
  const companies = useStore(s => s.companies);
  const selectedPocIds = useStore(s => s.selectedPocIds);
  const isEnriching = useStore(s => s.isEnriching);
  const setIsEnriching = useStore(s => s.setIsEnriching);
  const setCompanies = useStore(s => s.setCompanies);
  const selectedOrg = useStore(s => s.selectedOrg);
  const setEmailPocIds = useStore(s => s.setEmailPocIds);
  const setPendingEnrichPocIds = useStore(s => s.setPendingEnrichPocIds);
  const navigate = useNavigate();

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  if (selectedPocIds.size === 0) return null;

  const allPocs = companies.flatMap(c => c.pocs);
  const selectedPocs = allPocs.filter(p => selectedPocIds.has(p.id));
  const enrichedPocs = selectedPocs.filter(p => p.enrichment_status === 'enriched');
  const notEnrichedPocs = selectedPocs.filter(p => p.enrichment_status === 'not_enriched');

  const refreshCompanies = async () => {
    if (!selectedOrg) return;
    try {
      const res = await api.getOrgCompanies(selectedOrg.id);
      setCompanies(res.companies);
    } catch {
      // silent
    }
  };

  const startPolling = (pocIds: string[]) => {
    setPendingEnrichPocIds(pocIds);
    const enrichedSet = new Set(pocIds);

    const check = async () => {
      await refreshCompanies();
      const updated = useStore.getState().companies.flatMap(c => c.pocs);
      const tracked = updated.filter(p => enrichedSet.has(p.id));
      const allDone = tracked.every(p =>
        p.enrichment_status === 'enriched' || p.enrichment_status === 'failed'
      );

      if (allDone) {
        stopPolling();
        setIsEnriching(false);
        setPendingEnrichPocIds([]);
        const enrichedCount = tracked.filter(p => p.enrichment_status === 'enriched').length;
        const failedCount = tracked.filter(p => p.enrichment_status === 'failed').length;
        toast.success(`Enrichment complete: ${enrichedCount} enriched, ${failedCount} failed`);
      }
    };

    pollingRef.current = setInterval(check, POLL_INTERVAL);

    // Timeout after 5 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setIsEnriching(false);
      setPendingEnrichPocIds([]);
      toast.warning('Enrichment is taking longer than expected. Click Refresh to check status.');
    }, POLL_TIMEOUT);
  };

  const handleEnrich = async () => {
    const pocIds = notEnrichedPocs.map(p => p.id);
    if (pocIds.length === 0) return;
    setIsEnriching(true);
    try {
      await api.post<any>('/api/pocs/enrich', { poc_ids: pocIds });
      toast.info(`Enriching ${pocIds.length} POCs. This may take 1-5 minutes...`, { duration: 5000 });
      startPolling(pocIds);
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
              <Button size="sm" variant="outline" onClick={handleEnrich} disabled={isEnriching}>
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
