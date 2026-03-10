import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Factory, Flame, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, React.ReactNode> = {
  building: <Building className="h-5 w-5" />,
  factory: <Factory className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
};

const CTAButtons = () => {
  const selectedOrg = useStore(s => s.selectedOrg);
  const isGenerating = useStore(s => s.isGenerating);
  const setIsGenerating = useStore(s => s.setIsGenerating);
  const setCompanies = useStore(s => s.setCompanies);

  if (!selectedOrg) return null;

  const handleGenerate = async (segment: string) => {
    setIsGenerating(true);
    try {
      const res = await api.post<{ companies: any[] }>('/api/generate/full-pipeline', {
        org_id: selectedOrg.id,
        segment,
        company_count: 10,
        pocs_per_company: 5,
      });
      setCompanies(res.companies);
      toast.success('Lead generation complete!');
    } catch {
      toast.error('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {selectedOrg.config.ctas.map(cta => (
          <Card key={cta.id} className="border-border hover:border-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-accent">
                {iconMap[cta.icon] || <Building className="h-5 w-5" />}
                <span className="font-semibold text-foreground">{cta.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{cta.description}</p>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 mt-auto"
                disabled={isGenerating}
                onClick={() => handleGenerate(cta.segment)}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Generate →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CTAButtons;
