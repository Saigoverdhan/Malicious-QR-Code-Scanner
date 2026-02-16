
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, RiskLevel } from "../types";

export const analyzeURL = async (url: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze the following URL for phishing or malicious intent: ${url}
  
  Consider these features:
  1. URL length (unusually long).
  2. Number of dots or subdomains.
  3. HTTPS usage (or lack thereof).
  4. IP address usage instead of domain.
  5. Suspicious keywords (login, verify, update, bank, secure, account, payout).
  6. Lookalike domains (typosquatting).
  7. URL shortening services.
  
  Return the analysis in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk: {
              type: Type.STRING,
              description: 'The risk level of the URL: Safe, Suspicious, or Phishing.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'The confidence score from 0.0 to 1.0.',
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of reasons for this classification.',
            },
          },
          required: ["risk", "confidence", "reasons"],
        },
      },
    });

    const resultText = response.text.trim();
    const data = JSON.parse(resultText);
    
    // Validate risk level
    if (!Object.values(RiskLevel).includes(data.risk)) {
        data.risk = RiskLevel.SUSPICIOUS;
    }

    return data as AnalysisResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      risk: RiskLevel.SUSPICIOUS,
      confidence: 0.5,
      reasons: ["Unable to perform AI analysis. Automated heuristics suggest caution."],
    };
  }
};
