import type { Hono } from "hono";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchGoogle(query: string, maxResults: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    // Use Google search via fetch and parse the HTML response
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.google.com/search?q=${encodedQuery}&num=${maxResults}&hl=en`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google search failed: HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract search results from HTML using regex patterns
    // Look for result blocks with titles, URLs, and snippets
    const resultBlocks = html.split('<div class="g"');

    for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
      const block = resultBlocks[i];

      // Extract URL
      const urlMatch = block.match(/href="(https?:\/\/[^"]+)"/);
      const url = urlMatch ? urlMatch[1] : null;

      // Extract title
      const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/s);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : null;

      // Extract snippet
      const snippetMatch = block.match(/<span[^>]*class="[^"]*"[^>]*>(.*?)<\/span>/s) ||
                           block.match(/<div[^>]*data-sncf[^>]*>(.*?)<\/div>/s);
      const snippet = snippetMatch
        ? snippetMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim()
        : null;

      if (url && title) {
        results.push({
          title,
          url,
          snippet: snippet || "No snippet available",
        });
      }
    }

    // Fallback: try alternative parsing if no results found
    if (results.length === 0) {
      // Extract any links with snippets from the page
      const linkPattern = /<a[^>]+href="\/url\?q=(https?:\/\/[^&"]+)[^"]*"[^>]*>(.*?)<\/a>/gs;
      let match;
      while ((match = linkPattern.exec(html)) !== null && results.length < maxResults) {
        const url = decodeURIComponent(match[1]);
        const title = match[2].replace(/<[^>]+>/g, "").trim();
        if (title && !url.includes("google.com") && !url.includes("youtube.com/results")) {
          results.push({ title, url, snippet: "Snippet not available from search results" });
        }
      }
    }
  } catch (err: any) {
    // If Google blocks us, try DuckDuckGo lite as fallback
    try {
      const ddgResponse = await fetch(
        `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      if (ddgResponse.ok) {
        const ddgHtml = await ddgResponse.text();
        const linkPattern = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="result-link"[^>]*>(.*?)<\/a>/gs;
        const snippetPattern = /<td[^>]*class="result-snippet"[^>]*>(.*?)<\/td>/gs;

        let linkMatch;
        const snippets: string[] = [];
        let snipMatch;
        while ((snipMatch = snippetPattern.exec(ddgHtml)) !== null) {
          snippets.push(snipMatch[1].replace(/<[^>]+>/g, "").trim());
        }

        let idx = 0;
        while ((linkMatch = linkPattern.exec(ddgHtml)) !== null && results.length < maxResults) {
          results.push({
            title: linkMatch[2].replace(/<[^>]+>/g, "").trim(),
            url: linkMatch[1],
            snippet: snippets[idx] || "No snippet available",
          });
          idx++;
        }
      }
    } catch {
      // Both search engines failed
    }
  }

  return results;
}

function assessClaim(claim: string, snippets: SearchResult[]): { verdict: string; confidence: string; reasoning: string } {
  if (snippets.length === 0) {
    return {
      verdict: "unverifiable",
      confidence: "low",
      reasoning: "No relevant sources found to verify this claim.",
    };
  }

  const claimWords = claim.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let relevanceScore = 0;

  for (const result of snippets) {
    const combinedText = (result.title + " " + result.snippet).toLowerCase();
    for (const word of claimWords) {
      if (combinedText.includes(word)) relevanceScore++;
    }
  }

  const avgRelevance = relevanceScore / (claimWords.length * snippets.length || 1);

  if (avgRelevance > 0.5) {
    return {
      verdict: "likely_true",
      confidence: "medium",
      reasoning: `Found ${snippets.length} sources with high relevance to the claim. Multiple sources corroborate key terms.`,
    };
  } else if (avgRelevance > 0.2) {
    return {
      verdict: "partially_supported",
      confidence: "low",
      reasoning: `Found ${snippets.length} sources with moderate relevance. Some aspects of the claim are supported but not fully confirmed.`,
    };
  } else {
    return {
      verdict: "insufficient_evidence",
      confidence: "low",
      reasoning: `Found ${snippets.length} sources but with low relevance to the specific claim. Further investigation recommended.`,
    };
  }
}

export function registerRoutes(app: Hono) {
  app.post("/api/check", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.claim) {
      return c.json({ error: "Missing required field: claim" }, 400);
    }

    const claim: string = body.claim;
    if (claim.length < 5) {
      return c.json({ error: "Claim too short. Provide a clear factual statement to verify." }, 400);
    }
    if (claim.length > 500) {
      return c.json({ error: "Claim too long. Maximum 500 characters." }, 400);
    }

    const maxSources = Math.min(Math.max(body.max_sources || 5, 1), 10);

    try {
      const searchResults = await searchGoogle(claim, maxSources);
      const assessment = assessClaim(claim, searchResults);

      return c.json({
        claim,
        verdict: assessment.verdict,
        confidence: assessment.confidence,
        reasoning: assessment.reasoning,
        sources: searchResults.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
        sourcesFound: searchResults.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return c.json({ error: "Fact-check failed: " + err.message }, 500);
    }
  });
}
