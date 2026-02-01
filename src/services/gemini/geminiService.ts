import { GoogleGenAI } from "@google/genai";
import { Metric, SimulationResult } from "../../shared/types";
import { buildEconomicContext } from "../../features/data/utils/promptFactory";
import { DEBATE_PROTOCOL } from "../../features/debate/logic/debateRules";
import { SIMULATION_SCHEMA } from "../../features/analysis/utils/outputSchema";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function runSimulation(metrics: Metric[], context: string): Promise<SimulationResult> {
    // 1. Data Team: Builds the Economic Context string
    const metricContext = buildEconomicContext(metrics);

    // 2. Debate Team: Provides the rules of engagement
    const prompt = `
    Conduct a high-fidelity multi-agent macroeconomic simulation.
    
    ## Economic Data Environment
    ${metricContext}

    ## Scenario Context
    ${context || "Standard market operations with no external shocks."}

    ${DEBATE_PROTOCOL}

    ## Required Output
    Provide a structured JSON response reflecting the debate and final economic outlook.
  `;

    // 3. Analysis/Frontend Team: Defines the Output Schema
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: SIMULATION_SCHEMA
        }
    });

    try {
        const result = JSON.parse(response.text || "{}");
        return result as SimulationResult;
    } catch (e) {
        console.error("Failed to parse simulation result", e);
        throw new Error("Simulation engine failed to synthesize data.");
    }
}
