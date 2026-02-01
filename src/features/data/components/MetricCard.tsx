import React from 'react';
import { Metric } from '../../../shared/types';

interface MetricCardProps {
    metric: Metric;
    onChange: (id: string, value: number) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onChange }) => {
    const delta = metric.value - metric.baseValue;
    const isPositive = delta >= 0;

    return (
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{metric.label}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isPositive ? '+' : ''}{delta.toFixed(1)}{metric.unit === 'pts' ? ' pts' : '%'}
                </span>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-light text-slate-900">{metric.value}{metric.unit}</span>
            </div>

            <div className="relative pt-4">
                <input
                    type="range"
                    min={metric.min}
                    max={metric.max}
                    step={metric.unit === 'pts' ? 1 : 0.05}
                    value={metric.value}
                    onChange={(e) => onChange(metric.id, parseFloat(e.target.value))}
                    className="w-full cursor-pointer"
                />
                <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                    <span>Min {metric.min}</span>
                    <span className="text-slate-300">|</span>
                    <span>Max {metric.max}</span>
                </div>
            </div>
        </div>
    );
};
