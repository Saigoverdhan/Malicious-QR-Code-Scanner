
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, RiskLevel } from "../types";

export const analyzeURL = async (url: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-pro-preview for highest quality reasoning
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Examine this specific URL for potential phishing, malicious behavior, or security risks: ${url}`,
    config: {
      systemInstruction: `You are a specialized Cybersecurity Analyst for a real-time QR code security tool.
      
      Your goal is to provide a highly accurate risk assessment:
      1. **SAFE**: Known popular domains (google.com, apple.com, official government sites), clear non-malicious intent, and proper HTTPS.
      2. **SUSPICIOUS**: URL shorteners (bit.ly, tinyurl.com) unless they point to a known safe brand, new TLDs like .zip or .top, or unusual subdomains.
      3. **PHISHING**: Clear typosquatting (e.g., g00gle.com), lookalike login pages, or IP-based hosts for banking/social media themes.

      CRITICAL: Do not be overly aggressive. Many legitimate services use complex URLs. Only flag as Phishing or Suspicious if there are clear technical indicators of deception.
      
      Return a JSON object with:
      - risk: "Safe", "Suspicious", or "Phishing"
      - confidence: 0.0 to 1.0
      - reasons: Array of strings describing the specific markers found.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk: {
            type: Type.STRING,
            enum: ["Safe", "Suspicious", "Phishing"]
          },
          confidence: {
            type: Type.NUMBER,
          },
          reasons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["risk", "confidence", "reasons"],
      },
    },
  });

  try {
    const resultText = response.text.trim();
    const data = JSON.parse(resultText);
    
    // Normalize risk level to enum
    const riskMap: Record<string, RiskLevel> = {
      'Safe': RiskLevel.SAFE,
      'Suspicious': RiskLevel.SUSPICIOUS,
      'Phishing': RiskLevel.PHISHING
    };
    
    return {
      risk: riskMap[data.risk] || RiskLevel.SUSPICIOUS,
      confidence: data.confidence,
      reasons: data.reasons
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      risk: RiskLevel.SUSPICIOUS,
      confidence: 0.5,
      reasons: ["Neural analysis encountered an error. Proceed with caution."],
    };
  }
};
