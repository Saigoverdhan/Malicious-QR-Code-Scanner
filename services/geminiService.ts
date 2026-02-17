
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, RiskLevel } from "../types";

export const analyzeURL = async (url: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-pro-preview for better reasoning and higher accuracy in security analysis
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Thoroughly investigate this URL for security risks, phishing indicators, and malicious patterns: ${url}`,
    config: {
      systemInstruction: `You are a world-class cybersecurity expert specializing in URL forensics and phishing detection.
      Your task is to analyze the provided URL and determine its risk level (Safe, Suspicious, or Phishing).
      
      Look for:
      - Punycode/IDN homograph attacks (e.g., "g0ogle.com" instead of "google.com").
      - Subdomain deception (e.g., "paypal.security-update.com").
      - Unusual Top-Level Domains (TLDs) frequently used for malicious purposes (.zip, .mov, .top, .xyz).
      - Character substitutions and typosquatting.
      - Hidden redirects or URL shorteners (bit.ly, t.co) if they seem out of place.
      - Absence of HTTPS on sensitive-looking domains.
      - Use of raw IP addresses in the hostname.
      - Overly long or complex URLs designed to hide the true destination.
      
      Be decisive but fair. Provide clear, technical reasons for your classification.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk: {
            type: Type.STRING,
            description: 'The risk level: Safe, Suspicious, or Phishing.',
          },
          confidence: {
            type: Type.NUMBER,
            description: 'The confidence score from 0.0 to 1.0.',
          },
          reasons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific technical reasons for the classification.',
          },
        },
        required: ["risk", "confidence", "reasons"],
      },
    },
  });

  try {
    const resultText = response.text.trim();
    const data = JSON.parse(resultText);
    
    // Normalize risk level
    const riskMap: Record<string, RiskLevel> = {
      'safe': RiskLevel.SAFE,
      'suspicious': RiskLevel.SUSPICIOUS,
      'phishing': RiskLevel.PHISHING
    };
    
    const normalizedRisk = riskMap[data.risk.toLowerCase()] || RiskLevel.SUSPICIOUS;

    return {
      ...data,
      risk: normalizedRisk
    } as AnalysisResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      risk: RiskLevel.SUSPICIOUS,
      confidence: 0.5,
      reasons: ["Detailed AI analysis failed. Heuristic analysis suggests caution with unverified links."],
    };
  }
};
