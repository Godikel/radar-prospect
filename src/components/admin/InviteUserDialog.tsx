import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Org } from '@/types';

const ROLES = ['agent', 'manager', 'org_admin', 'super_admin'];

interface InviteUserDialogProps {
  onInvited: () => void;
}

const InviteUserDialog = ({ onInvited }: InviteUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'agent' });
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get<Org[]>('/api/orgs').then(data => {
      setOrgs(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, [open]);

  const toggleOrg = (orgId: string) => {
    setSelectedOrgIds(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name) return;
    setInviting(true);
    try {
      await api.post('/api/users/invite', {
        ...form,
        use_case_ids: selectedOrgIds,
      });
      toast.success('Invitation sent');
      setOpen(false);
      setForm({ email: '', name: '', role: 'agent' });
      setSelectedOrgIds([]);
      onInvited();
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
          <Plus className="h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="user@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {orgs.length > 0 && (
            <div className="space-y-2">
              <Label>Organizations</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                {orgs.map(org => (
                  <div key={org.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`invite-org-${org.id}`}
                      checked={selectedOrgIds.includes(org.id)}
                      onCheckedChange={() => toggleOrg(org.id)}
                    />
                    <Label htmlFor={`invite-org-${org.id}`} className="text-sm cursor-pointer">
                      {org.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={inviting}>
              {inviting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
