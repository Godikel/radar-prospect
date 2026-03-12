import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Org } from '@/types';

const OrgSelector = () => {
  const orgs = useStore(s => s.orgs);
  const setOrgs = useStore(s => s.setOrgs);
  const selectedOrg = useStore(s => s.selectedOrg);
  const setSelectedOrg = useStore(s => s.setSelectedOrg);

  useEffect(() => {
    api.get<Org[]>('/api/orgs').then(setOrgs);
  }, [setOrgs]);

  const getStatus = (org: Org): 'active' | 'archived' => {
    if (org.status) return org.status;
    return org.name.toLowerCase().includes('legacy') ? 'archived' : 'active';
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
      <Select
        value={selectedOrg?.id || ''}
        onValueChange={(val) => {
          const org = orgs.find(o => o.id === val);
          if (org) setSelectedOrg(org);
        }}
      >
        <SelectTrigger className="w-full max-w-sm bg-card">
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent>
          {orgs.map(org => {
            const status = getStatus(org);
            return (
              <SelectItem key={org.id} value={org.id}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{org.name}</span>
                  <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                    {status === 'active' ? 'Active' : 'Archived'}
                  </Badge>
                  <span className="text-muted-foreground text-xs">({org.subtitle})</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrgSelector;
