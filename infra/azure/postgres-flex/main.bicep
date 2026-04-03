targetScope = 'resourceGroup'

@description('Deployment mode for the PostgreSQL Flexible Server network boundary.')
@allowed([
  'public'
  'private'
])
param networkMode string = 'private'

@description('Azure region for the server and supporting resources.')
param location string = resourceGroup().location

@description('Flexible Server name. Must be globally unique within the postgres.database.azure.com namespace.')
param serverName string

@description('Application database name.')
param databaseName string = 'keon_control'

@description('PostgreSQL major version.')
@allowed([
  '15'
  '16'
])
param postgresVersion string = '16'

@description('Flexible Server administrator login.')
param administratorLogin string = 'keon_admin'

@secure()
@description('Flexible Server administrator password.')
param administratorPassword string

@description('Flexible Server SKU tier.')
@allowed([
  'Burstable'
  'GeneralPurpose'
  'MemoryOptimized'
])
param skuTier string = 'Burstable'

@description('Flexible Server SKU name, for example Standard_B2ms or Standard_D2ads_v5.')
param skuName string = 'Standard_B2ms'

@description('Allocated storage in GiB.')
@minValue(32)
@maxValue(32768)
param storageSizeGB int = 64

@description('Backup retention in days.')
@minValue(7)
@maxValue(35)
param backupRetentionDays int = 7

@description('Geo-redundant backup setting.')
@allowed([
  'Disabled'
  'Enabled'
])
param geoRedundantBackup string = 'Disabled'

@description('High availability mode.')
@allowed([
  'Disabled'
  'SameZone'
  'ZoneRedundant'
])
param highAvailabilityMode string = 'Disabled'

@description('Primary availability zone.')
param availabilityZone string = '1'

@description('Standby availability zone when high availability is enabled.')
param standbyAvailabilityZone string = '2'

@description('Public firewall rules to create when networkMode is public.')
param publicFirewallRules array = []

@description('Private DNS zone name. Must end in .postgres.database.azure.com when using private mode.')
param privateDnsZoneName string = '${serverName}.postgres.database.azure.com'

@description('Virtual network name to create when using private mode.')
param virtualNetworkName string = '${serverName}-vnet'

@description('Address space for the virtual network when using private mode.')
param virtualNetworkAddressPrefix string = '10.40.0.0/16'

@description('Delegated subnet name for Flexible Server when using private mode.')
param delegatedSubnetName string = 'postgres'

@description('Delegated subnet CIDR for Flexible Server when using private mode.')
param delegatedSubnetPrefix string = '10.40.1.0/24'

var isPrivate = networkMode == 'private'
var databaseHost = '${serverName}.postgres.database.azure.com'
var databaseUrlTemplate = 'postgresql://${administratorLogin}:__REPLACE_WITH_PASSWORD__@${databaseHost}:5432/${databaseName}?sslmode=require'

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-11-01' = if (isPrivate) {
  name: virtualNetworkName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        virtualNetworkAddressPrefix
      ]
    }
    subnets: [
      {
        name: delegatedSubnetName
        properties: {
          addressPrefix: delegatedSubnetPrefix
          delegations: [
            {
              name: 'postgres-flex-delegation'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
    ]
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = if (isPrivate) {
  name: privateDnsZoneName
  location: 'global'
}

resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (isPrivate) {
  parent: privateDnsZone
  name: '${serverName}-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: virtualNetwork.id
    }
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: serverName
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: postgresVersion
    createMode: 'Create'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    availabilityZone: availabilityZone
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup
    }
    highAvailability: highAvailabilityMode == 'Disabled'
      ? {
          mode: 'Disabled'
        }
      : {
          mode: highAvailabilityMode
          standbyAvailabilityZone: standbyAvailabilityZone
        }
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    network: isPrivate
      ? {
          publicNetworkAccess: 'Disabled'
          delegatedSubnetResourceId: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetworkName, delegatedSubnetName)
          privateDnsZoneArmResourceId: privateDnsZone.id
        }
      : {
          publicNetworkAccess: 'Enabled'
        }
  }
  dependsOn: isPrivate ? [
    privateDnsZoneLink
  ] : []
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource publicFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = [for rule in publicFirewallRules: if (!isPrivate) {
  parent: postgresServer
  name: rule.name
  properties: {
    startIpAddress: rule.startIpAddress
    endIpAddress: rule.endIpAddress
  }
}]

output serverId string = postgresServer.id
output serverNameOut string = postgresServer.name
output databaseHost string = databaseHost
output databaseNameOut string = database.name
output administratorLoginOut string = administratorLogin
output fqdn string = databaseHost
output databaseUrlTemplate string = databaseUrlTemplate
output delegatedSubnetId string = isPrivate ? resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetworkName, delegatedSubnetName) : ''
output privateDnsZoneId string = isPrivate ? privateDnsZone.id : ''
