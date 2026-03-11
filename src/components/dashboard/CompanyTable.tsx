import { useStore } from '@/stores/useStore';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ContactSelector from './ContactSelector';
import type { POC } from '@/types';

const enrichmentIcon = (poc: POC) => {
  if (poc.enrichment_status === 'enriched') return <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />;
  if (poc.enrichment_status === 'failed') return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
  return <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
};

const enrichmentLabel = (poc: POC) => {
  if (poc.enrichment_status === 'failed') return 'Enrichment failed';
  if (poc.enrichment_status !== 'enriched') return 'Not enriched';
  return null; // handled by ContactSelector
};

const CompanyTable = () => {
  const companies = useStore(s => s.companies);
  const selectedPocIds = useStore(s => s.selectedPocIds);
  const togglePoc = useStore(s => s.togglePoc);
  const selectCompanyPocs = useStore(s => s.selectCompanyPocs);
  const expandedCompanies = useStore(s => s.expandedCompanies);
  const toggleCompanyExpand = useStore(s => s.toggleCompanyExpand);

  if (companies.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No companies generated yet</p>
        <p className="text-sm mt-1">Select an organization and generate leads to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {companies.map(company => {
        const isExpanded = expandedCompanies.has(company.id);
        const allPocIds = company.pocs.map(p => p.id);
        const allSelected = allPocIds.length > 0 && allPocIds.every(id => selectedPocIds.has(id));
        const someSelected = allPocIds.some(id => selectedPocIds.has(id));
        const enrichedCount = company.pocs.filter(p => p.enrichment_status === 'enriched').length;

        return (
          <div key={company.id} className="border border-border rounded-lg bg-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => toggleCompanyExpand(company.id)}
            >
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={() => selectCompanyPocs(company.id)}
                onClick={e => e.stopPropagation()}
              />
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{company.name}</span>
                  <Badge variant={company.segment === 'Enterprise' ? 'default' : 'secondary'} className="text-xs">
                    {company.segment}
                  </Badge>
                  <span className="text-xs text-muted-foreground">• {company.location}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {(company.employee_count ?? 0).toLocaleString()} employees • {company.industry ?? 'Unknown'}
                  {!isExpanded && <span className="ml-2">• {company.pocs.length} POCs ({enrichedCount} enriched)</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                {formatDistanceToNow(new Date(company.generated_at), { addSuffix: true })}
              </span>
            </div>

            {isExpanded && (
              <div className="border-t border-border bg-muted/30">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground">POCs ({company.pocs.length})</div>
                {company.pocs.map(poc => {
                  const isEnriched = poc.enrichment_status === 'enriched';
                  const fallbackLabel = enrichmentLabel(poc);

                  return (
                    <div key={poc.id} className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-muted/50 transition-colors border-t border-border/50">
                      <Checkbox
                        checked={selectedPocIds.has(poc.id)}
                        onCheckedChange={() => togglePoc(poc.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{poc.name}</span>
                          <span className="text-xs text-muted-foreground">— {poc.title}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {isEnriched ? (
                            <>
                              <ContactSelector poc={poc} type="email" />
                              <ContactSelector poc={poc} type="phone" />
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {enrichmentIcon(poc)}
                              <span className={`text-xs ${poc.enrichment_status === 'failed' ? 'text-warning' : 'text-muted-foreground'}`}>
                                {fallbackLabel}
                              </span>
                            </div>
                          )}
                        </div>
                        {poc.linkedin_url && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{poc.linkedin_url}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CompanyTable;
