
export enum SimulationStep {
    SETUP = 'SETUP',
    SIMULATING = 'SIMULATING',
    REPORT = 'REPORT'
}

export type AgentRole =
    | 'fed_chair'
    | 'treasury'
    | 'market_strategist'
    | 'business_ceo'
    | 'household'
    | 'geopolitics'
    | 'resource_king'
    | 'tech_innovator'
    | 'safety_layer';

export type MetricCategory = 'monetary' | 'production' | 'fiscal' | 'real_economy' | 'market';

export interface Metric {
    id: string;
    label: string;
    value: number;
    unit: string;
    category: MetricCategory;
    assignedAgent: AgentRole;
    source?: string;
    symbol?: string;
    description?: string;
    min: number;
    max: number;
    baseValue: number;
}

export interface AgentResponse {
    role: string;
    avatar: string; // URL or path
    perspective: string;
    consensus: string;
    impactScore: number;
}

export interface SimulationResult {
    agents: AgentResponse[];
    summary: string;
    finalMetrics: {
        label: string;
        oldValue: string;
        newValue: string;
        trend: 'up' | 'down' | 'stable';
    }[];
}
