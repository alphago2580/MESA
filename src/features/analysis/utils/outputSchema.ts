import { Type, Schema } from "@google/genai";

export const SIMULATION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        agents: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    perspective: { type: Type.STRING, description: "Agent's specific analysis of their assigned metrics" },
                    consensus: { type: Type.STRING, description: "Final stance after debate" },
                    impactScore: { type: Type.NUMBER, description: "Net impact on their domain (-10 to +10)" }
                }
            }
        },
        summary: { type: Type.STRING, description: "Professional economic briefing of the outcome" },
        finalMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    oldValue: { type: Type.STRING },
                    newValue: { type: Type.STRING },
                    trend: { type: Type.STRING, description: "up, down, or stable" }
                }
            }
        }
    },
    required: ['agents', 'summary', 'finalMetrics']
};
