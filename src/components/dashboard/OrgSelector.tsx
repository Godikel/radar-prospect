import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Org } from '@/types';

const OrgSelector = () => {
  const orgs = useStore(s => s.orgs);
  const setOrgs = useStore(s => s.setOrgs);
  const selectedOrg = useStore(s => s.selectedOrg);
  const setSelectedOrg = useStore(s => s.setSelectedOrg);

  useEffect(() => {
    api.get<Org[]>('/api/orgs').then(setOrgs);
  }, [setOrgs]);

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
          {orgs.map(org => (
            <SelectItem key={org.id} value={org.id}>
              <span className="font-medium">{org.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">({org.subtitle})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrgSelector;
