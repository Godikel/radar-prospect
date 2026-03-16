import { useAuthStore } from '@/stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, BarChart3, Send, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserMenu from '@/components/UserMenu';

const Header = () => {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Leads', path: '/dashboard', icon: Target },
    { label: 'Outreach', path: '/outreach', icon: Send },
    { label: 'Dashboard', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:block">Skillbetter LeadGen</span>
        </div>
        {user && (
          <nav className="flex items-center gap-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'text-sm gap-1.5 relative',
                    isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
                  )}
                </Button>
              );
            })}
          </nav>
        )}
      </div>
      {user && <UserMenu />}
    </header>
  );
};

export default Header;
