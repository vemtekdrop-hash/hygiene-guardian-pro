import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function Branches() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');

  useEffect(() => { loadBranches(); }, []);

  const loadBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data as Branch[]);
  };

  const addBranch = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from('branches').insert({ name, manager_name: manager });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Filial adicionada!' });
    setName(''); setManager(''); setDialogOpen(false);
    loadBranches();
  };

  const deleteBranch = async (id: string) => {
    await supabase.from('branches').delete().eq('id', id);
    loadBranches();
    toast({ title: 'Filial removida' });
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Filiais</h1>
            <p className="text-sm text-muted-foreground">Gerencie as unidades do restaurante</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Filial
          </Button>
        </div>

        {branches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma filial cadastrada.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {branches.map(b => (
              <Card key={b.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{b.name}</p>
                      {b.manager_name && <p className="text-xs text-muted-foreground">Responsável: {b.manager_name}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteBranch(b.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Nova Filial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Filial</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Filial Centro" />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Nome do responsável" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={addBranch}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
