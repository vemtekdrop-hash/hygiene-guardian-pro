import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ObservationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (observation: string) => void;
  questionNumber: number;
  currentObservation?: string;
}

export default function ObservationModal({ open, onClose, onSave, questionNumber, currentObservation }: ObservationModalProps) {
  const [text, setText] = useState(currentObservation || '');

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Observações - Questão {questionNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Descreva as não conformidades e sugestões de melhoria:</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Descreva aqui as observações relevantes..."
            className="min-h-[120px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Observação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
