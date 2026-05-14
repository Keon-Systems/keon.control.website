using './mcp-front-door.bicep'

param profileName = 'afd-keon-mcp-prod'
param endpointName = 'keon-mcp-prod-edge'
param originGroupName = 'og-mcp-prod'
param originName = 'origin-mcp-containerapp'
param originHostName = 'keon-mcp-gateway.redrock-24997c6f.eastus2.azurecontainerapps.io'
param wafPolicyName = 'wafkeonmcpprod'
param securityPolicyName = 'sp-mcp-prod'
param mcpRateLimitPerMinute = 120