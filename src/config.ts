import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "fact-checker",
  slug: "fact-checker",
  description: "Fact-check claims by searching the web and returning relevant evidence snippets.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/check",
      price: "$0.005",
      description: "Fact-check a claim by searching for evidence online",
      toolName: "research_check_fact",
      toolDescription: "Use this when you need to verify a factual claim, check if a statement is true, or find evidence supporting or contradicting a claim. Accepts a claim text and returns relevant web snippets, source URLs, and a confidence assessment. Do NOT use for general web scraping — use web_scrape_to_markdown instead. Do NOT use for SEO analysis — use seo_audit_page instead. Do NOT use for sentiment analysis — use sentiment_analyzer instead.",
      inputSchema: {
        type: "object",
        properties: {
          claim: { type: "string", description: "The factual claim to verify (e.g., 'The Eiffel Tower is 330 meters tall')" },
          max_sources: { type: "number", description: "Maximum number of sources to return (default: 5, max: 10)" },
        },
        required: ["claim"],
      },
    },
  ],
};
