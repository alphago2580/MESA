
import React, { useState, useCallback } from 'react';
import { SimulationStep, Metric, SimulationResult } from './shared/types';
import { INITIAL_METRICS } from './shared/constants';
import { MetricCard } from './features/data';
import { SimulationProgress } from './features/debate';
import { ReportView } from './features/analysis';
import { runSimulation } from './services/gemini';

const App: React.FC = () => {
  const [step, setStep] = useState<SimulationStep>(SimulationStep.SETUP);
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMetricChange = (id: string, value: number) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, value } : m));
  };

  const handleExecute = async () => {
    setError(null);
    setStep(SimulationStep.SIMULATING);
    try {
      const simResult = await runSimulation(metrics, context);
      setResult(simResult);
      setStep(SimulationStep.REPORT);
    } catch (err: any) {
      setError(err.message || 'The simulation engine encountered a structural failure.');
      setStep(SimulationStep.SETUP);
    }
  };

  const calculateTotalShift = () => {
    const total = metrics.reduce((acc, m) => {
      const diff = Math.abs(m.value - m.baseValue) / (m.max - m.min || 1);
      return acc + diff;
    }, 0);
    return (total / metrics.length).toFixed(2);
  };

  return (
    <div className="min-h-screen selection:bg-indigo-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1.5 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 tracking-tighter text-lg uppercase">MacroSphere</span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          <a href="#" className="text-slate-900 border-b-2 border-slate-900 pb-1">Simulation</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Historical Data</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Economic API</a>
        </div>
        <button className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all">
          Enterprise Access
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="pt-32">
        {step === SimulationStep.SETUP && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              {/* Setup Left: Variables */}
              <div className="lg:col-span-7">
                <h1 className="text-6xl font-serif text-slate-900 mb-6 leading-tight">
                  Architecting <br />
                  <span className="italic">Economic Stability.</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-lg mb-12 leading-relaxed font-light">
                  Adjust the structural variables of the macroeconomy. Our multi-agent neural network will evaluate the cascading effects across societal pillars.
                </p>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Strategic Variables</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {metrics.map(m => (
                    <MetricCard key={m.id} metric={m} onChange={handleMetricChange} />
                  ))}
                </div>
              </div>

              {/* Setup Right: Context & Action */}
              <div className="lg:col-span-5 pt-12">
                <div className="bg-white/40 p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">Natural Language Context</label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Describe specific conditions (e.g., 'A sudden global supply chain crisis' or 'Aggressive push for green energy transition')..."
                    className="w-full h-40 bg-white/50 border border-slate-100 rounded-2xl p-6 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none placeholder:text-slate-300 leading-relaxed mb-8"
                  />

                  <div className="bg-slate-900 rounded-3xl p-8 text-white">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Total System Shift</span>
                      <span className="font-mono text-indigo-400 text-xs tracking-widest">Δ-Index: {calculateTotalShift()}</span>
                    </div>
                    <button
                      onClick={handleExecute}
                      className="w-full py-5 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                    >
                      Execute Simulation Engine
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                    {error && (
                      <p className="mt-4 text-xs text-rose-400 font-medium text-center">{error}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === SimulationStep.SIMULATING && <SimulationProgress />}

        {step === SimulationStep.REPORT && result && (
          <ReportView result={result} onReset={() => setStep(SimulationStep.SETUP)} />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-100 flex flex-col items-center">
        <div className="opacity-20 font-bold text-slate-900 tracking-tighter text-sm uppercase mb-2">MACROSPHERE SYSTEM</div>
        <p className="text-[10px] text-slate-400 tracking-widest uppercase">Proprietary Predictive Neural Core • v3.8.4</p>
      </footer>
    </div>
  );
};

export default App;
