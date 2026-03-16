import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const UserMenu = () => {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  const initials = (user.name || user.email)
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isAdmin = user.is_super_admin || user.role === 'super_admin' || user.role === 'org_admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 text-muted-foreground h-9 px-2">
          <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <span className="hidden sm:inline text-sm">{user.name || user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.role && (
            <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
              {user.role.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate('/admin/users')} className="gap-2 cursor-pointer">
            <Users className="h-4 w-4" />
            User Management
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
