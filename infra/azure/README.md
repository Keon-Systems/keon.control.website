# Azure Front Door Edge for MCP Gateway

This directory preserves the non-disruptive Azure Front Door Premium + WAF
scaffold for the MCP Gateway.

## What it creates

- Azure Front Door Premium profile: `afd-keon-mcp-prod`
- Endpoint: `keon-mcp-prod-edge`
- Origin group: `og-mcp-prod`
- Origin: MCP Gateway Azure Container App FQDN
- WAF policy: `wafkeonmcpprod`
- WAF security policy association: `sp-mcp-prod`

## WAF posture

- Prevention mode
- Microsoft Default Rule Set 2.2
- Microsoft Bot Manager Rule Set 1.1
- Microsoft HTTP DDoS Rule Set 1.0
- Custom allow-path posture: only `/mcp`, `/mcp/*`, and `/health`
- MCP method restriction: `/mcp` must be `POST`
- MCP path rate limit: `120` requests per minute by default

## Deploy when needed

```powershell
az deployment group create `
  --resource-group keon-rg `
  --template-file infra/azure/mcp-front-door.bicep `
  --parameters infra/azure/mcp-front-door.prod.bicepparam
```

## Important cutover notes

- Do not point `mcp.keon.systems` at Front Door until the default endpoint
  routes `/health` and `/mcp` successfully.
- Do not expose Cortex, Collective, or Runtime origins publicly.
- Add MCP Gateway origin protection before DNS cutover. The immediate
  recommended control is Gateway-side validation of `X-Azure-FDID`, plus
  trusted forwarded-header handling.
- Edge-blocked requests happen before MCP ingress and do not emit per-request
  MCP receipts. Gateway-accepted directives still require terminal outcome
  receipts.