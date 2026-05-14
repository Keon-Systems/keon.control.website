@description('Azure Front Door profile name for the MCP Gateway edge.')
param profileName string = 'afd-keon-mcp-prod'

@description('Azure Front Door endpoint name. The generated azurefd.net hostname is non-deterministic.')
param endpointName string = 'keon-mcp-prod-edge'

@description('Origin group name for the MCP Gateway Container App origin.')
param originGroupName string = 'og-mcp-prod'

@description('Origin name for the MCP Gateway Container App.')
param originName string = 'origin-mcp-containerapp'

@description('MCP Gateway Container App FQDN. Do not include protocol.')
param originHostName string

@description('WAF policy name for MCP Gateway edge protection.')
param wafPolicyName string = 'wafkeonmcpprod'

@description('Security policy name binding the WAF policy to the Front Door endpoint.')
param securityPolicyName string = 'sp-mcp-prod'

@description('Per-client rate limit threshold for MCP paths per minute.')
param mcpRateLimitPerMinute int = 120

var globalLocation = 'global'

resource profile 'Microsoft.Cdn/profiles@2024-09-01' = {
  name: profileName
  location: globalLocation
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-09-01' = {
  parent: profile
  name: endpointName
  location: globalLocation
  properties: {
    enabledState: 'Enabled'
  }
}

resource originGroup 'Microsoft.Cdn/profiles/originGroups@2024-09-01' = {
  parent: profile
  name: originGroupName
  properties: {
    sessionAffinityState: 'Disabled'
    healthProbeSettings: {
      probePath: '/health'
      probeProtocol: 'Https'
      probeRequestType: 'GET'
      probeIntervalInSeconds: 120
    }
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
  }
}

resource origin 'Microsoft.Cdn/profiles/originGroups/origins@2024-09-01' = {
  parent: originGroup
  name: originName
  properties: {
    hostName: originHostName
    originHostHeader: originHostName
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

resource route 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-09-01' = {
  parent: endpoint
  name: 'route-mcp-prod'
  properties: {
    enabledState: 'Enabled'
    originGroup: {
      id: originGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
  }
  dependsOn: [
    origin
  ]
}

resource waf 'Microsoft.Network/frontDoorWebApplicationFirewallPolicies@2025-11-01' = {
  name: wafPolicyName
  location: globalLocation
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
      customBlockResponseStatusCode: 403
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.2'
          ruleSetAction: 'Block'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.1'
        }
        {
          ruleSetType: 'Microsoft_HTTPDDoSRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
    }
    customRules: {
      rules: [
        {
          name: 'BlockNonAllowedPaths'
          enabledState: 'Enabled'
          priority: 90
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'RegEx'
              negateCondition: true
              matchValue: [ '^/(mcp($|/.*)|health$)' ]
              transforms: []
            }
          ]
          action: 'Block'
        }
        {
          name: 'RateLimitMcpPaths'
          enabledState: 'Enabled'
          priority: 100
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: mcpRateLimitPerMinute
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'BeginsWith'
              negateCondition: false
              matchValue: [ '/mcp' ]
              transforms: []
            }
          ]
          action: 'Block'
        }
        {
          name: 'BlockNonPostMcp'
          enabledState: 'Enabled'
          priority: 110
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'BeginsWith'
              negateCondition: false
              matchValue: [ '/mcp' ]
              transforms: []
            }
            {
              matchVariable: 'RequestMethod'
              operator: 'Equal'
              negateCondition: true
              matchValue: [ 'POST' ]
              transforms: []
            }
          ]
          action: 'Block'
        }
      ]
    }
  }
}

resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2024-09-01' = {
  parent: profile
  name: securityPolicyName
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: waf.id
      }
      associations: [
        {
          domains: [
            {
              id: endpoint.id
            }
          ]
          patternsToMatch: [ '/*' ]
        }
      ]
    }
  }
  dependsOn: [
    route
  ]
}

output frontDoorEndpointHostName string = endpoint.properties.hostName
output wafPolicyId string = waf.id