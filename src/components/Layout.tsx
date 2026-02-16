import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, BarChart3, Building2, Settings, LogOut, Menu, X } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Layout({ children }: { children: ReactNode }) {
  const { signOut, isAdmin, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
    { to: '/logs', icon: FileText, label: 'Logs', adminOnly: false },
    { to: '/chart', icon: BarChart3, label: 'Gráficos', adminOnly: false },
    { to: '/branches', icon: Building2, label: 'Filiais', adminOnly: true },
    { to: '/settings', icon: Settings, label: 'Config', adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-border bg-secondary/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Troppo Buono" className="h-8 w-auto" />
            <div>
              <h1 className="font-display font-bold text-xs leading-tight">Boas Práticas</h1>
              <p className="text-[9px] text-muted-foreground">Controle de Inspeções</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 pb-2">
            <nav className="flex flex-wrap justify-center gap-2">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent transition-colors"
                  activeClassName="bg-accent text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{user?.email}</span>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={signOut}>
                <LogOut className="w-3 h-3 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-secondary/30 flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Troppo Buono" className="h-10 w-auto" />
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">Boas Práticas</h1>
              <p className="text-[10px] text-muted-foreground">Controle de Inspeções</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
              activeClassName="bg-accent text-foreground font-medium"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-3 truncate">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
