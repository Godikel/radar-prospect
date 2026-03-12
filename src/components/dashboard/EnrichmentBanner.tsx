import { useStore } from '@/stores/useStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const EnrichmentBanner = () => {
  const isEnriching = useStore(s => s.isEnriching);
  const pendingPocIds = useStore(s => s.pendingEnrichPocIds);
  const companies = useStore(s => s.companies);

  if (!isEnriching || pendingPocIds.length === 0) return null;

  const allPocs = companies.flatMap(c => c.pocs);
  const tracked = allPocs.filter(p => pendingPocIds.includes(p.id));
  const doneCount = tracked.filter(p => p.enrichment_status === 'enriched' || p.enrichment_status === 'failed').length;

  return (
    <Alert className="border-accent/50 bg-accent/5">
      <Loader2 className="h-4 w-4 animate-spin text-accent" />
      <AlertTitle>Enrichment in Progress</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>Checking for updates every 10 seconds... ({doneCount}/{pendingPocIds.length} complete)</p>
        <div className="space-y-1">
          {tracked.map(poc => (
            <div key={poc.id} className="flex items-center gap-2 text-xs">
              {poc.enrichment_status === 'enriched' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : poc.enrichment_status === 'failed' ? (
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <span className="text-foreground">{poc.name}</span>
              <span className="text-muted-foreground">{poc.title}</span>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EnrichmentBanner;
