import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, LayoutDashboard, FileText, BarChart3, Building2, Settings, LogOut } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { signOut, isAdmin, user } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-secondary/30 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">Boas Práticas</h1>
              <p className="text-[10px] text-muted-foreground">Controle de Inspeções</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors" activeClassName="bg-accent text-foreground font-medium">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>
          <NavLink to="/logs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors" activeClassName="bg-accent text-foreground font-medium">
            <FileText className="w-4 h-4" />
            Logs de Visitas
          </NavLink>
          <NavLink to="/chart" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors" activeClassName="bg-accent text-foreground font-medium">
            <BarChart3 className="w-4 h-4" />
            Evolução Mensal
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/branches" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors" activeClassName="bg-accent text-foreground font-medium">
                <Building2 className="w-4 h-4" />
                Filiais
              </NavLink>
              <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors" activeClassName="bg-accent text-foreground font-medium">
                <Settings className="w-4 h-4" />
                Configurações
              </NavLink>
            </>
          )}
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
