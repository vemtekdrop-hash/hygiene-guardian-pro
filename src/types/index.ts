export interface InspectionType {
  id: string;
  number: number;
  category: string;
  description: string;
  weight: number;
  active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  manager_name: string;
}

export interface Visit {
  id: string;
  branch_id: string;
  visit_date: string;
  inspector_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  evaluation: string;
  notes: string;
  created_at: string;
}

export interface InspectionResult {
  id: string;
  visit_id: string;
  inspection_type_id: string;
  status: 'ok' | 'irregular' | 'pending';
  observations: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
}

export type UserRole = 'admin' | 'employee';

export function getEvaluation(percentage: number): { label: string; className: string } {
  if (percentage >= 100) return { label: 'EXCELENTE', className: 'score-badge-excellent' };
  if (percentage >= 93) return { label: 'ÓTIMO', className: 'score-badge-great' };
  if (percentage >= 80) return { label: 'SATISFATÓRIO', className: 'score-badge-satisfactory' };
  if (percentage >= 70) return { label: 'REGULAR', className: 'score-badge-regular' };
  return { label: 'INSUFICIENTE', className: 'score-badge-poor' };
}

export function calculateScore(
  results: InspectionResult[],
  inspectionTypes: InspectionType[]
): { totalScore: number; maxScore: number; percentage: number; evaluation: string } {
  let totalScore = 0;
  let maxScore = 0;

  for (const type of inspectionTypes) {
    if (!type.active) continue;
    const points = type.weight === 2 ? 100 : 50;
    const penalty = type.weight === 2 ? -200 : -100;
    maxScore += points;

    const result = results.find(r => r.inspection_type_id === type.id);
    if (result?.status === 'ok') {
      totalScore += points;
    } else if (result?.status === 'irregular') {
      totalScore += penalty;
    }
  }

  const percentage = maxScore > 0 ? Math.max(0, Math.round((totalScore / maxScore) * 100)) : 0;
  const { label } = getEvaluation(percentage);

  return { totalScore, maxScore, percentage, evaluation: label };
}
