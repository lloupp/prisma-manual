'use client';

import { useEffect, useState } from 'react';
import { listSimulatorScenarios, setSimulatorScenario, SimulatorScenarioDescriptor } from '../../lib/obd-client';

interface ScenarioPickerProps {
  disabled?: boolean;
}

/** Seletor de cenário do simulador OBD - só aparece quando o OBD Service
 * está rodando em modo simulador (404 do endpoint = esconde o seletor,
 * nunca finge que dá para trocar cenário em hardware real). Troca em
 * tempo real via POST /simulator/scenario, sem reiniciar o serviço. */
export default function ScenarioPicker({ disabled }: ScenarioPickerProps) {
  const [scenarios, setScenarios] = useState<SimulatorScenarioDescriptor[] | null>(null);
  const [selected, setSelected] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    listSimulatorScenarios()
      .then(list => { if (!ignore) setScenarios(list); })
      .catch(() => { if (!ignore) setScenarios([]); });
    return () => { ignore = true; };
  }, []);

  if (scenarios === null || scenarios.length === 0) return null;

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    setError(null);
    try {
      await setSimulatorScenario(selected);
    } catch {
      setError('Não foi possível trocar o cenário.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-zinc-100">1. Selecionar cenário do simulador</h2>
      <p className="text-zinc-500 text-xs">
        Dados sintéticos de teste - não representam o Prisma real. Útil para testar o fluxo de
        diagnóstico sem o carro conectado.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Selecionar cenário do simulador"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={disabled}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 disabled:opacity-50"
        >
          <option value="">Selecione um cenário...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id} title={s.description}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={handleApply}
          disabled={disabled || !selected || applying}
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 px-4 py-2 rounded-lg text-sm"
        >
          {applying ? 'Aplicando...' : 'Aplicar cenário'}
        </button>
      </div>
      {selected && (
        <p className="text-zinc-500 text-xs">{scenarios.find(s => s.id === selected)?.description}</p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
