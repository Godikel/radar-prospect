import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/layout/Header';
import InviteUserDialog from '@/components/admin/InviteUserDialog';
import AssignOrgDialog from '@/components/admin/AssignOrgDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, UserCheck, UserX, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface UserUseCase {
  use_case_id: string;
  role: string;
  use_cases?: { name: string };
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  user_use_cases?: UserUseCase[];
}

const ROLES = ['agent', 'manager', 'org_admin', 'super_admin'];

const UserManagement = () => {
  const currentUser = useAuthStore(s => s.user);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: ManagedUser[]; total: number }>('/api/users');
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/api/users/${userId}`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (user: ManagedUser) => {
    setUpdatingId(user.id);
    try {
      const endpoint = user.is_active
        ? `/api/users/${user.id}/deactivate`
        : `/api/users/${user.id}/activate`;
      await api.post(endpoint, {});
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  const isSelf = (userId: string) => currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage team members, roles, and organization assignments</p>
          </div>
          <InviteUserDialog onInvited={fetchUsers} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">No users found</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organizations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">
                      {u.name}
                      {isSelf(u.id) && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell>
                      {isSelf(u.id) ? (
                        <Badge variant="secondary" className="text-xs">{u.role.replace(/_/g, ' ')}</Badge>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={v => handleRoleChange(u.id, v)}
                          disabled={updatingId === u.id}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {r.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(u.user_use_cases ?? []).length > 0 ? (
                          (u.user_use_cases ?? []).map(uc => (
                            <Badge key={uc.use_case_id} variant="outline" className="text-[10px] px-1.5 py-0">
                              {uc.use_cases?.name || uc.use_case_id}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-1"
                          onClick={() => setAssignTarget(u)}
                          title="Assign organizations"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_login
                        ? formatDistanceToNow(new Date(u.last_login), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf(u.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={updatingId === u.id}
                          className={u.is_active ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                        >
                          {updatingId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.is_active ? (
                            <><UserX className="h-4 w-4 mr-1" /> Deactivate</>
                          ) : (
                            <><UserCheck className="h-4 w-4 mr-1" /> Activate</>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {assignTarget && (
          <AssignOrgDialog
            open={!!assignTarget}
            onOpenChange={open => { if (!open) setAssignTarget(null); }}
            userId={assignTarget.id}
            userName={assignTarget.name}
            currentAssignments={assignTarget.user_use_cases ?? []}
            onSaved={fetchUsers}
          />
        )}
      </main>
    </div>
  );
};

export default UserManagement;
