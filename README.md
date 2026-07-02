# Fact Checker API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://fact-checker.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Fact-check claims by searching the web and returning relevant evidence snippets. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "fact-checker": {
      "url": "https://fact-checker.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl -X POST "https://fact-checker.api.klymax402.com/api/check" \
  -H "Content-Type: application/json" \
  -d '{"claim":"..."}'
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `research_check_fact` | POST | `/api/check` | $0.005 | Fact-check a claim by searching for evidence online |

### `research_check_fact`

Use this when you need to verify a factual claim, check if a statement is true, or find evidence supporting or contradicting a claim. Accepts a claim text and returns relevant web snippets, source URLs, and a confidence assessment. Do NOT use for general web scraping — use web_scrape_to_markdown instead. Do NOT use for SEO analysis — use seo_audit_page instead. Do NOT use for sentiment analysis — use sentiment_analyzer instead.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `claim` | string | yes | The factual claim to verify (e.g., 'The Eiffel Tower is 330 meters tall') |
| `max_sources` | number | no | Maximum number of sources to return (default: 5, max: 10) |

## Example agent prompts

- "Verify a factual claim, check if a statement is true, or find evidence supporting or contradicting a claim"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
