import { Alert, AlertDescription } from '@/components/ui/alert';
import { Archive } from 'lucide-react';

const ArchivedBanner = () => (
  <Alert className="border-muted bg-muted/30">
    <Archive className="h-4 w-4" />
    <AlertDescription className="text-sm text-muted-foreground">
      This is an archived organization. Data is read-only — lead generation, enrichment, and email features are disabled.
    </AlertDescription>
  </Alert>
);

export default ArchivedBanner;
