import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Org } from '@/types';

interface UserUseCase {
  use_case_id: string;
  role: string;
  use_cases?: { name: string };
}

interface AssignOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentAssignments: UserUseCase[];
  onSaved: () => void;
}

const ASSIGNMENT_ROLES = ['agent', 'manager', 'org_admin'];

const AssignOrgDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  currentAssignments,
  onSaved,
}: AssignOrgDialogProps) => {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selections, setSelections] = useState<Record<string, { checked: boolean; role: string }>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<Org[]>('/api/orgs').then(data => {
      const orgList = Array.isArray(data) ? data : [];
      setOrgs(orgList);

      const initial: Record<string, { checked: boolean; role: string }> = {};
      orgList.forEach(org => {
        const existing = currentAssignments.find(a => a.use_case_id === org.id);
        initial[org.id] = {
          checked: !!existing,
          role: existing?.role || 'agent',
        };
      });
      setSelections(initial);
    }).catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, [open, currentAssignments]);

  const toggleOrg = (orgId: string) => {
    setSelections(prev => ({
      ...prev,
      [orgId]: { ...prev[orgId], checked: !prev[orgId]?.checked },
    }));
  };

  const setRole = (orgId: string, role: string) => {
    setSelections(prev => ({
      ...prev,
      [orgId]: { ...prev[orgId], role },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selected = Object.entries(selections)
        .filter(([, v]) => v.checked)
        .map(([id, v]) => ({ use_case_id: id, role: v.role }));

      await api.post(`/api/users/${userId}/assign-use-case`, { assignments: selected });
      toast.success('Organization assignments updated');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to update assignments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Organizations — {userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : orgs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No organizations available.</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto py-2">
            {orgs.map(org => (
              <div key={org.id} className="flex items-center gap-3 py-1.5">
                <Checkbox
                  id={`org-${org.id}`}
                  checked={selections[org.id]?.checked || false}
                  onCheckedChange={() => toggleOrg(org.id)}
                />
                <Label htmlFor={`org-${org.id}`} className="flex-1 text-sm cursor-pointer">
                  {org.name}
                </Label>
                {selections[org.id]?.checked && (
                  <Select
                    value={selections[org.id]?.role || 'agent'}
                    onValueChange={v => setRole(org.id, v)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNMENT_ROLES.map(r => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignOrgDialog;
