import { Metric } from "../../../shared/types";

export function buildEconomicContext(metrics: Metric[]): string {
    // Group metrics by category for better context
    const groupedMetrics = metrics.reduce((acc, m) => {
        if (!acc[m.category]) acc[m.category] = [];
        acc[m.category].push(`${m.label} (${m.symbol || 'N/A'}): ${m.value}${m.unit} (Baseline: ${m.baseValue}${m.unit}) [Agent: ${m.assignedAgent}]`);
        return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(groupedMetrics)
        .map(([cat, lines]) => `[${cat.toUpperCase()}]\n${lines.join('\n')}`)
        .join('\n\n');
}
