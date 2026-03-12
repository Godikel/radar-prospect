import { useStore } from '@/stores/useStore';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, Search, CheckCircle2, AlertTriangle, XCircle, Loader2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ContactSelector from './ContactSelector';
import type { POC } from '@/types';

const enrichmentDisplay = (poc: POC) => {
  switch (poc.enrichment_status) {
    case 'enriched':
      return { icon: <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />, label: null };
    case 'no_contact':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />,
        label: 'No contact found',
        tooltip: 'EasyLeads could not find contact information for this person',
        className: 'text-warning',
      };
    case 'failed':
      return {
        icon: <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />,
        label: 'Enrichment failed',
        tooltip: poc.enrichment_error || 'Enrichment failed',
        className: 'text-destructive',
      };
    case 'pending':
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-accent shrink-0" />,
        label: 'Enriching...',
        className: 'text-muted-foreground',
      };
    default:
      return {
        icon: <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
        label: 'Not enriched',
        className: 'text-muted-foreground',
      };
  }
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
    <TooltipProvider>
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
                    const status = enrichmentDisplay(poc);

                    return (
                      <div key={poc.id} className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-muted/50 transition-colors border-t border-border/50">
                        <Checkbox
                          checked={selectedPocIds.has(poc.id)}
                          onCheckedChange={() => togglePoc(poc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{poc.name}</span>
                            {poc.title && <span className="text-xs text-muted-foreground">— {poc.title}</span>}
                            {poc.department && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {poc.department}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {poc.enrichment_status === 'enriched' ? (
                              <>
                                <ContactSelector poc={poc} type="email" />
                                <ContactSelector poc={poc} type="phone" />
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {status.icon}
                                <span className={`text-xs ${status.className ?? 'text-muted-foreground'}`}>
                                  {status.label}
                                </span>
                                {status.tooltip && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">{status.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </div>
                          {poc.linkedin_url && (
                            <a
                              href={poc.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline mt-0.5 inline-block"
                            >
                              LinkedIn ↗
                            </a>
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
    </TooltipProvider>
  );
};

export default CompanyTable;
