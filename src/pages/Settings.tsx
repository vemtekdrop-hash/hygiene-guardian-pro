import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InspectionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function Settings() {
  const { toast } = useToast();
  const [types, setTypes] = useState<InspectionType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState({ category: '', description: '', weight: 1, number: 0 });

  useEffect(() => { loadTypes(); }, []);

  const loadTypes = async () => {
    const { data } = await supabase.from('inspection_types').select('*').order('number');
    if (data) setTypes(data as InspectionType[]);
  };

  const addType = async () => {
    if (!newType.category || !newType.description) return;
    const nextNumber = types.length > 0 ? Math.max(...types.map(t => t.number)) + 1 : 1;
    const { error } = await supabase.from('inspection_types').insert({
      ...newType,
      number: nextNumber,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Item de inspeção adicionado!' });
    setDialogOpen(false);
    setNewType({ category: '', description: '', weight: 1, number: 0 });
    loadTypes();
  };

  const toggleActive = async (type: InspectionType) => {
    await supabase.from('inspection_types').update({ active: !type.active }).eq('id', type.id);
    loadTypes();
  };

  const deleteType = async (id: string) => {
    await supabase.from('inspection_types').delete().eq('id', id);
    loadTypes();
    toast({ title: 'Item removido' });
  };

  const categories = [...new Set(types.map(t => t.category))];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie os itens de inspeção</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Item
          </Button>
        </div>

        {categories.map(cat => (
          <Card key={cat}>
            <CardHeader>
              <CardTitle className="font-display text-sm uppercase tracking-wider text-muted-foreground">{cat}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {types.filter(t => t.category === cat).map(type => (
                <div key={type.id} className={`flex items-start gap-3 p-3 rounded-lg border ${type.active ? 'border-border' : 'border-border opacity-50'}`}>
                  <span className="text-xs font-mono font-bold text-muted-foreground mt-0.5">{type.number}.</span>
                  <p className="flex-1 text-sm">{type.description}</p>
                  <span className="text-xs text-muted-foreground shrink-0">Peso {type.weight}</span>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(type)}>
                    {type.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteType(type.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Novo Item de Inspeção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={newType.category} onChange={(e) => setNewType({ ...newType, category: e.target.value })} placeholder="Ex: HIGIENE PESSOAL" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={newType.description} onChange={(e) => setNewType({ ...newType, description: e.target.value })} placeholder="Descrição do item..." />
              </div>
              <div className="space-y-2">
                <Label>Peso</Label>
                <Select value={String(newType.weight)} onValueChange={(v) => setNewType({ ...newType, weight: Number(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Peso 1 (50pts / -100pts)</SelectItem>
                    <SelectItem value="2">Peso 2 (100pts / -200pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={addType}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
