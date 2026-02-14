import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Chart() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [selectedBranch, year]);

  const loadBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data as Branch[]);
  };

  const loadChartData = async () => {
    let query = supabase
      .from('visits')
      .select('visit_date, percentage')
      .gte('visit_date', `${year}-01-01`)
      .lte('visit_date', `${year}-12-31`);

    if (selectedBranch !== 'all') query = query.eq('branch_id', selectedBranch);

    const { data } = await query;

    const monthlyData = MONTHS.map((month, i) => {
      const monthVisits = (data || []).filter(v => {
        const d = new Date(v.visit_date);
        return d.getMonth() === i;
      });
      const avg = monthVisits.length > 0
        ? Math.round(monthVisits.reduce((sum, v) => sum + Number(v.percentage), 0) / monthVisits.length)
        : 0;
      return { month, percentage: avg, hasData: monthVisits.length > 0 };
    });

    setChartData(monthlyData);
  };

  const getBarColor = (pct: number) => {
    if (pct >= 93) return 'hsl(142, 71%, 45%)';
    if (pct >= 80) return 'hsl(38, 92%, 50%)';
    if (pct >= 70) return 'hsl(25, 95%, 53%)';
    return 'hsl(0, 72%, 51%)';
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Evolução Mensal</h1>
            <p className="text-sm text-muted-foreground">Percentual de conformidade por mês</p>
          </div>
          <div className="flex gap-3">
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
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Conformidade']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(0,0%,90%)' }}
                />
                <ReferenceLine y={80} stroke="hsl(38, 92%, 50%)" strokeDasharray="3 3" label={{ value: 'Meta 80%', position: 'right', fontSize: 10 }} />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.hasData ? getBarColor(entry.percentage) : 'hsl(0,0%,90%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-success" /> ≥93% Ótimo/Excelente</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-warning" /> 80-92% Satisfatório</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }} /> 70-79% Regular</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-destructive" /> &lt;70% Insuficiente</div>
        </div>
      </div>
    </Layout>
  );
}
