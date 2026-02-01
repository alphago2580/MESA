
import React, { useEffect, useState } from 'react';
import { AGENT_ROLES } from '../../../shared/constants';

export const SimulationProgress: React.FC = () => {
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIdx(prev => (prev + 1) % AGENT_ROLES.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full mb-8 animate-pulse">
                NEURAL NETWORK ACTIVE: RUNNING AGENT DEBATE
            </div>

            <h2 className="text-4xl font-serif text-slate-900 mb-12 italic">Synthesis in progress...</h2>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-8">
                {AGENT_ROLES.map((agent, idx) => (
                    <div
                        key={agent.id}
                        className={`transition-all duration-500 flex flex-col items-center ${activeIdx === idx ? 'scale-110 opacity-100' : 'scale-90 opacity-40'
                            }`}
                    >
                        <div className={`relative p-1 rounded-full border-2 ${activeIdx === idx ? 'border-indigo-500' : 'border-transparent'}`}>
                            <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded-full object-cover grayscale" />
                            {activeIdx === idx && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white animate-ping" />
                            )}
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-700">{agent.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                            {activeIdx === idx ? 'Reasoning' : 'Waiting'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-20 flex justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
            </div>
        </div>
    );
};
