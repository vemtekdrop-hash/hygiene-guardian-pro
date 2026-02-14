import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Visit, Branch, getEvaluation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import { CalendarDays } from 'lucide-react';

export default function Logs() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadVisits();
  }, [selectedBranch]);

  const loadBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data as Branch[]);
  };

  const loadVisits = async () => {
    let query = supabase.from('visits').select('*').order('visit_date', { ascending: false });
    if (selectedBranch !== 'all') query = query.eq('branch_id', selectedBranch);
    const { data } = await query;
    if (data) setVisits(data as Visit[]);
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Logs de Visitas</h1>
            <p className="text-sm text-muted-foreground">Histórico de inspeções realizadas</p>
          </div>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as Filiais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Filiais</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {visits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma visita registrada.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visits.map(visit => {
              const branch = branches.find(b => b.id === visit.branch_id);
              const eval_ = getEvaluation(Number(visit.percentage));
              return (
                <Card key={visit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{branch?.name || 'Filial'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(visit.visit_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-display font-bold">{Number(visit.percentage).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">{visit.total_score}/{visit.max_score} pts</p>
                      </div>
                      <Badge className={`${eval_.className} min-w-[100px] justify-center`}>{eval_.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
