
import React from 'react';
import { SimulationResult } from '../../../shared/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AGENT_ROLES } from '../../../shared/constants';

const mockChartData = [
    { name: 'Q1', val: 400 },
    { name: 'Q2', val: 300 },
    { name: 'Q3', val: 600 },
    { name: 'Q4', val: 800 },
    { name: 'Q5', val: 700 },
    { name: 'Q6', val: 900 },
];

export const ReportView: React.FC<{ result: SimulationResult, onReset: () => void }> = ({ result, onReset }) => {
    return (
        <div className="max-w-6xl mx-auto pb-24 px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h1 className="text-5xl font-serif text-slate-900 mb-4">Executive Briefing</h1>
                    <p className="text-slate-500 max-w-xl leading-relaxed">
                        The multi-agent consensus indicates a structural shift in baseline stability.
                        Below is the comprehensive analysis of cascading effects across all strategic pillars.
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="px-8 py-3 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                    Adjust Variables
                </button>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {result.finalMetrics.slice(0, 3).map((m, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">{m.label}</h4>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-light text-slate-900">{m.newValue}</span>
                            <span className={`text-xs font-bold ${m.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {m.trend === 'up' ? '↑' : '↓'} Shift
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Agents Debate */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-serif text-slate-900 mb-8 border-b border-slate-50 pb-4">Agent Perspectives & Debate</h3>
                        <div className="space-y-12">
                            {result.agents.map((agent, i) => {
                                const roleInfo = AGENT_ROLES.find(r => r.name.toLowerCase().includes(agent.role.toLowerCase())) || AGENT_ROLES[i % AGENT_ROLES.length];
                                return (
                                    <div key={i} className="flex gap-6">
                                        <img src={roleInfo.avatar} className="w-12 h-12 rounded-full object-cover grayscale opacity-80" />
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-sm text-slate-800">{roleInfo.name}</span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Verified Agent</span>
                                            </div>
                                            <p className="text-slate-500 text-sm leading-relaxed italic mb-4">"{agent.perspective}"</p>
                                            <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-400">
                                                <p className="text-xs text-slate-600 font-medium">Consensus: {agent.consensus}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Visualization & Summary */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl">
                        <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-6">Aggregate Synthesis</h4>
                        <div className="h-48 w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockChartData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="val" stroke="#818cf8" fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed font-light">
                            {result.summary}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Impact Matrix</h4>
                        <div className="space-y-4">
                            {result.agents.map((a, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500">
                                        <span>{a.role}</span>
                                        <span>{a.impactScore > 0 ? '+' : ''}{a.impactScore}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${a.impactScore > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                            style={{ width: `${Math.abs(a.impactScore) * 10}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
