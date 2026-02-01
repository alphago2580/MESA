
import { Metric } from './types';

export const AGENT_ROLES = [
    { id: 'fed_chair', name: 'Fed Chair (The Anchor)', avatar: 'https://picsum.photos/seed/fed/100/100', description: 'Focuses on inflation control and currency stability.' },
    { id: 'treasury', name: 'Treasurer (The Treasurer)', avatar: 'https://picsum.photos/seed/treasury/100/100', description: 'Manages budget, debt, and fiscal policy.' },
    { id: 'market_strategist', name: 'Market Strategist (The Hunter)', avatar: 'https://picsum.photos/seed/market/100/100', description: 'Analyzes asset prices, sentiment, and risk premiums.' },
    { id: 'business_ceo', name: 'CEO (The Builder)', avatar: 'https://picsum.photos/seed/ceo/100/100', description: 'Focuses on corporate growth, capex, and labor costs.' },
    { id: 'household', name: 'Household (The Survivor)', avatar: 'https://picsum.photos/seed/household/100/100', description: 'Focuses on wage, cost of living, and quality of life.' },
    { id: 'geopolitics', name: 'Diplomat (The Diplomat)', avatar: 'https://picsum.photos/seed/geo/100/100', description: 'Analyzes global conflicts and supply chain risks.' },
    { id: 'resource_king', name: 'Resource King', avatar: 'https://picsum.photos/seed/oil/100/100', description: 'Controls energy, commodities, and raw materials.' },
    { id: 'tech_innovator', name: 'Innovator (The Oracle)', avatar: 'https://picsum.photos/seed/tech/100/100', description: 'Focuses on AI, productivity, and disruption.' },
    { id: 'safety_layer', name: 'Safety Layer (The Judge)', avatar: 'https://picsum.photos/seed/judge/100/100', description: 'Fact-checks claims and ensures logical consistency.' }
];

export const INITIAL_METRICS: Metric[] = [
    // 1. Monetary (Fed Chair)
    {
        id: 'fed_rate',
        label: 'US Fed Rate',
        value: 5.5,
        unit: '%',
        category: 'monetary',
        assignedAgent: 'fed_chair',
        source: 'FRED',
        symbol: 'FEDFUNDS',
        min: 0,
        max: 10,
        baseValue: 5.5
    },
    {
        id: 'm2_supply',
        label: 'M2 Money Supply',
        value: 20.8,
        unit: 'T$',
        category: 'monetary',
        assignedAgent: 'fed_chair',
        source: 'FRED',
        symbol: 'M2SL',
        min: 15,
        max: 25,
        baseValue: 20.8
    },

    // 2. Fiscal (Treasurer)
    {
        id: 'govt_spending',
        label: 'Govt Spending',
        value: 3000,
        unit: 'B$',
        category: 'fiscal',
        assignedAgent: 'treasury',
        source: 'FRED',
        symbol: 'GCEC1',
        min: 2000,
        max: 5000,
        baseValue: 3000
    },
    {
        id: 'debt_to_gdp',
        label: 'Debt to GDP',
        value: 120,
        unit: '%',
        category: 'fiscal',
        assignedAgent: 'treasury',
        source: 'FRED',
        symbol: 'GFDEGDQ188S',
        min: 80,
        max: 200,
        baseValue: 120
    },

    // 3. Production (Business CEO & Resource King)
    {
        id: 'oil_wti',
        label: 'WTI Crude Oil',
        value: 75.0,
        unit: '$',
        category: 'production',
        assignedAgent: 'resource_king',
        source: 'Yahoo',
        symbol: 'CL=F',
        min: 40,
        max: 120,
        baseValue: 75.0
    },
    {
        id: 'copper_price',
        label: 'Copper',
        value: 4.0,
        unit: '$',
        category: 'production',
        assignedAgent: 'resource_king',
        source: 'Yahoo',
        symbol: 'HG=F',
        min: 2,
        max: 6,
        baseValue: 4.0
    },
    {
        id: 'export_total',
        label: 'Total Exports',
        value: 250,
        unit: 'B$',
        category: 'production',
        assignedAgent: 'business_ceo',
        source: 'FRED',
        symbol: 'EXPGS',
        min: 100,
        max: 400,
        baseValue: 250
    },

    // 4. Real Economy (Household)
    {
        id: 'cpi_headline',
        label: 'CPI (YoY)',
        value: 3.2,
        unit: '%',
        category: 'real_economy',
        assignedAgent: 'household',
        source: 'FRED',
        symbol: 'CPIAUCSL',
        min: 0,
        max: 10,
        baseValue: 3.2
    },
    {
        id: 'unemp_rate',
        label: 'Unemployment Rate',
        value: 3.8,
        unit: '%',
        category: 'real_economy',
        assignedAgent: 'household',
        source: 'FRED',
        symbol: 'UNRATE',
        min: 2,
        max: 10,
        baseValue: 3.8
    },

    // 5. Market (Market Strategist & Tech Innovator)
    {
        id: 'nasdaq_index',
        label: 'NASDAQ',
        value: 16000,
        unit: 'Pts',
        category: 'market',
        assignedAgent: 'tech_innovator',
        source: 'Yahoo',
        symbol: '^IXIC',
        min: 10000,
        max: 20000,
        baseValue: 16000
    },
    {
        id: 'vix_index',
        label: 'VIX (Fear)',
        value: 14,
        unit: 'Pts',
        category: 'market',
        assignedAgent: 'market_strategist',
        source: 'Yahoo',
        symbol: '^VIX',
        min: 10,
        max: 80,
        baseValue: 14
    }
];
