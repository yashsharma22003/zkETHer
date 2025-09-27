## Deployments (Mainnet)

  token 0x364f24C2D13c0856419DD3E421efA3b41369f802
  claimTopicsRegistry 0x6b6f358A8baa55C858ECaaF231C726f445Ddb127
  identityRegistry 0xB0B0b80A9166a9b7c27E700FfFf6AfCfA8acaC9D
  identityRegistryStorage 0x0C59D4D07F39cef27d851FF664b623Ea5976FC8a
  trustedIssuersRegistry 0x7910f8B8Da1a159d6a6A2465468Fa37A9Aac16F4
  modularCompliance 0xc56bf22DCE535612D408bd2D4236Cad6EE2c6431

  TREXImplementationAuthority 0x53ACe7307B7dbF39F9fB5876FCfd3ac1fB07471e
  IAFactory deployed at: 0x3B746CC01bFCe0CE93a82FA49c6Bdde1C3BA550E
  Identity deployed at: 0x1B6075d151acE981042ea7F78F97C833B450EadD
  Onchain ID ImplementationAuthority deployed at: 0x90Baf8fc42a2d5eCe11152F9CC64E1C733928f23
  IdFactory deployed at: 0x39992CCEAEDB0fa8f4fd3f2FBC5134707635B371
  TREXFactory deployed at: 0x19c99c82512E85732d0f9c563E550bea00A04070
  CLAIM_ISSUER_ADDRESS=0xd75849340fa68E19610791c398880D8a4a089096
  Module address : 0xA5D4D189939E1f8Ac1E8d329273dc345554fCc95

## Deployment Steps (Mainnet)

# 1. Deploy Core Implementations
forge script script/deployImplementations.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify

# 2. Deploy ImplementationAuthority
forge script script/deployImplementationAuthority.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify

# 3. Configure the ImplementationAuthority
forge script script/configureImplementationAuthority.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY

# 4. Deploy ImplementationAuthorityFactory
forge script script/deployImplementationAuthorityFactory.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify

# 5. Deploy OnchainIdentityAuthority
forge script script/deployOnchainIdentityAuthority.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify

# 6. Deploy IDFactory
forge script script/deployIDFactory.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify

# 7. Deploy TREXFactory
forge script script/deployTREXFactory.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify

# 8. Set the TREXFactory address
forge script script/setTREXFactory.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY

# 9. Set the ImplementationAuthorityFactory address
forge script script/setImplementationAuthorityFactory.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY

# 10. Configure the IDFactory
forge script script/configureIdFactory.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY

# 11. Deploy claim issuer
forge script script/deployClaimIssuer.s.sol:DeployClaimIssuer --rpc-url $POLYGON_AMOY_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify

# 12. Configure claim issuer
forge script script/configureClaimIssuer.s.sol:ConfigureClaimIssuer --rpc-url $POLYGON_AMOY_RPC_URL --private-key $PRIVATE_KEY --broadcast

# 13. Run the final setup for the TREX suite
forge script script/setupTREXSuite.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY

# 14. Add module for compliance
forge script script/addModule.s.sol --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --private-key $PRIVATE_KEY --verify --via-ir

# 15. Whitelist User
forge script script/whitelistUser.s.sol:WhitelistUser --rpc-url $POLYGON_AMOY_RPC_URL --private-key $PRIVATE_KEY --broadcast


## TREX Suite Deployment (Mainnet)

Identity Registry Proxy - 0xAa7bdF67038D0c8a8F14418eeDBFb965213732Da
Identity Registry Storage - 0x465410cf105964EC4560139339f1ac3ADc497b89
Trusted Issuers Registry Proxy - 0x1C25cf316c96a4144389B1eEff3B7590930ffEF4
ClaimTopics Registry Proxy - 0x5b355f1bf79CBe0E476E1DDc0311828436cF5d62 
Modular Compliance Proxy - 0x1D7763C6C7bc12fc53e6667b17671d911aE6CaEC
Token Proxy - 0x3eaC25f463ed170fC79EfD629A0BD93f9336A016
