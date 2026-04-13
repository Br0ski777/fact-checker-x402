import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "fact-checker",
  slug: "fact-checker",
  description: "Verify factual claims with web evidence, source URLs, and confidence assessment. AI-powered fact-checking.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/check",
      price: "$0.005",
      description: "Fact-check a claim by searching for evidence online",
      toolName: "research_check_fact",
      toolDescription: `Use this when you need to verify a factual claim or check if a statement is true. Searches the web for evidence and returns sourced snippets with a confidence assessment.

1. verdict: assessment result (supported, contradicted, partially_supported, unverifiable)
2. confidence: confidence in the verdict 0-100
3. sources: array of evidence snippets with title, URL, relevant excerpt, and stance (supports/contradicts/neutral)
4. summary: concise explanation of why the claim is supported or contradicted
5. claimAnalyzed: the original claim as parsed

Example output: {"verdict":"supported","confidence":88,"summary":"Multiple sources confirm the Eiffel Tower is 330m tall","sources":[{"title":"Wikipedia","url":"https://en.wikipedia.org/wiki/Eiffel_Tower","excerpt":"The tower is 330 metres tall...","stance":"supports"}],"claimAnalyzed":"The Eiffel Tower is 330 meters tall"}

Use this BEFORE presenting unverified facts to users. Essential for content validation, research verification, and combating misinformation.

Do NOT use for general web scraping -- use web_scrape_to_markdown. Do NOT use for research reports -- use research_generate_report. Do NOT use for sentiment analysis -- use text_analyze_sentiment.`,
      inputSchema: {
        type: "object",
        properties: {
          claim: { type: "string", description: "The factual claim to verify (e.g., 'The Eiffel Tower is 330 meters tall')" },
          max_sources: { type: "number", description: "Maximum number of sources to return (default: 5, max: 10)" },
        },
        required: ["claim"],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "claim": {
              "type": "string",
              "description": "Claim checked"
            },
            "verdict": {
              "type": "string",
              "description": "Verdict (true/false/partially true/unverifiable)"
            },
            "confidence": {
              "type": "number",
              "description": "Confidence 0-100"
            },
            "reasoning": {
              "type": "string",
              "description": "Explanation of verdict"
            },
            "sources": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "title": {
                    "type": "string"
                  },
                  "url": {
                    "type": "string"
                  },
                  "snippet": {
                    "type": "string"
                  }
                }
              }
            },
            "sourcesFound": {
              "type": "number",
              "description": "Number of sources found"
            },
            "timestamp": {
              "type": "string"
            }
          },
          "required": [
            "claim",
            "verdict",
            "confidence",
            "reasoning"
          ]
        },
    },
  ],
};
