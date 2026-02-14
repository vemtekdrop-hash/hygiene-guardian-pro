import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InspectionType, InspectionResult, Branch, Visit, calculateScore, getEvaluation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, Plus } from 'lucide-react';
import ObservationModal from '@/components/ObservationModal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';

export default function Dashboard() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([]);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [results, setResults] = useState<InspectionResult[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<InspectionType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranches();
    loadInspectionTypes();
  }, []);

  useEffect(() => {
    if (selectedBranch) loadLatestVisit();
  }, [selectedBranch]);

  const loadBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data as Branch[]);
    if (data && data.length > 0) setSelectedBranch(data[0].id);
    setLoading(false);
  };

  const loadInspectionTypes = async () => {
    const { data } = await supabase.from('inspection_types').select('*').eq('active', true).order('number');
    if (data) setInspectionTypes(data as InspectionType[]);
  };

  const loadLatestVisit = async () => {
    const { data: visit } = await supabase
      .from('visits')
      .select('*')
      .eq('branch_id', selectedBranch)
      .order('visit_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (visit) {
      setCurrentVisit(visit as Visit);
      const { data: res } = await supabase
        .from('inspection_results')
        .select('*')
        .eq('visit_id', visit.id);
      if (res) setResults(res as InspectionResult[]);
    } else {
      setCurrentVisit(null);
      setResults([]);
    }
  };

  const createNewVisit = async () => {
    if (!selectedBranch || !user) return;
    const { data, error } = await supabase
      .from('visits')
      .insert({ branch_id: selectedBranch, inspector_id: user.id, visit_date: new Date().toISOString().split('T')[0] })
      .select()
      .single();
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setCurrentVisit(data as Visit);
    setResults([]);
    toast({ title: 'Nova inspeção criada!' });
  };

  const handleStatusChange = async (inspType: InspectionType, status: 'ok' | 'irregular') => {
    if (!currentVisit || !isAdmin) return;

    if (status === 'irregular') {
      setSelectedQuestion(inspType);
      setModalOpen(true);
      return;
    }

    await upsertResult(inspType.id, status, '');
  };

  const upsertResult = async (inspTypeId: string, status: string, observations: string) => {
    if (!currentVisit) return;

    const existing = results.find(r => r.inspection_type_id === inspTypeId);

    if (existing) {
      await supabase
        .from('inspection_results')
        .update({ status, observations })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('inspection_results')
        .insert({ visit_id: currentVisit.id, inspection_type_id: inspTypeId, status, observations });
    }

    // Reload results
    const { data } = await supabase
      .from('inspection_results')
      .select('*')
      .eq('visit_id', currentVisit.id);
    if (data) {
      setResults(data as InspectionResult[]);
      // Update visit score
      const score = calculateScore(data as InspectionResult[], inspectionTypes);
      await supabase
        .from('visits')
        .update({
          total_score: score.totalScore,
          max_score: score.maxScore,
          percentage: score.percentage,
          evaluation: score.evaluation,
        })
        .eq('id', currentVisit.id);
      setCurrentVisit(prev => prev ? { ...prev, ...score } : null);
    }
  };

  const handleObservationSave = async (observation: string) => {
    if (!selectedQuestion) return;
    await upsertResult(selectedQuestion.id, 'irregular', observation);
    toast({ title: 'Irregularidade registrada', description: 'Observação salva com sucesso.' });
  };

  const score = calculateScore(results, inspectionTypes);
  const evaluation = getEvaluation(score.percentage);

  const groupedTypes = inspectionTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, InspectionType[]>);

  const currentBranch = branches.find(b => b.id === selectedBranch);

  if (loading) return <Layout><div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Carregando...</p></div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard de Inspeções</h1>
            <p className="text-sm text-muted-foreground">Nutricionista Responsável: Rosani Sommer Bertão</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar Filial" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button onClick={createNewVisit} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Nova Inspeção
              </Button>
            )}
          </div>
        </div>

        {branches.length === 0 && isAdmin && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma filial cadastrada. Adicione uma filial para começar.</p>
              <Button onClick={() => window.location.href = '/branches'}>Cadastrar Filial</Button>
            </CardContent>
          </Card>
        )}

        {/* Score Card */}
        {currentVisit && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Filial</p>
                <p className="text-lg font-bold font-display mt-1">{currentBranch?.name}</p>
                <p className="text-xs text-muted-foreground">{currentBranch?.manager_name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pontuação</p>
                <p className="text-3xl font-bold font-display mt-1">{score.totalScore}</p>
                <p className="text-xs text-muted-foreground">de {score.maxScore} pontos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Percentual</p>
                <p className="text-3xl font-bold font-display mt-1">{score.percentage}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avaliação</p>
                <Badge className={`mt-2 text-sm px-3 py-1 ${evaluation.className}`}>{evaluation.label}</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Checklist */}
        {currentVisit && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">
                CHECK-LIST – Higiene Pessoal, Higiene das instalações, equipamentos e utensílios, etapas operacionais, preenchimento das planilhas de controle e Controle de pragas
              </CardTitle>
              <p className="text-xs text-muted-foreground">Data: {currentVisit.visit_date}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedTypes).map(([category, types]) => (
                <div key={category}>
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-2">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {types.map(type => {
                      const result = results.find(r => r.inspection_type_id === type.id);
                      return (
                        <div
                          key={type.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            result?.status === 'ok'
                              ? 'border-success/30 bg-success/5'
                              : result?.status === 'irregular'
                              ? 'border-destructive/30 bg-destructive/5'
                              : 'border-border'
                          }`}
                        >
                          <span className="text-xs font-mono font-bold text-muted-foreground mt-0.5 min-w-[24px]">
                            {type.number}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed">{type.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">
                                Peso {type.weight} • {type.weight === 2 ? '100pts / -200pts' : '50pts / -100pts'}
                              </Badge>
                              {result?.status === 'irregular' && result.observations && (
                                <span className="text-[10px] text-destructive flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {result.observations.substring(0, 50)}...
                                </span>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant={result?.status === 'ok' ? 'default' : 'outline'}
                                className={result?.status === 'ok' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
                                onClick={() => handleStatusChange(type, 'ok')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={result?.status === 'irregular' ? 'destructive' : 'outline'}
                                onClick={() => handleStatusChange(type, 'irregular')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {!isAdmin && result && (
                            <Badge className={result.status === 'ok' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                              {result.status === 'ok' ? 'OK' : 'Irregular'}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <ObservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleObservationSave}
        questionNumber={selectedQuestion?.number || 0}
        currentObservation={results.find(r => r.inspection_type_id === selectedQuestion?.id)?.observations}
      />
    </Layout>
  );
}
