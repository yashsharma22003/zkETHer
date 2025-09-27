# anvil deployment setup

simple guide for teammates to get zkether contracts running locally

## prerequisites

install foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## step 1: clone and setup

```bash
git clone <your-repo-url>
cd mobile-zkETHer
npm install
```

## step 2: get your machine ip

```bash
ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1 | head -1
```

save this ip address - you'll need it for step 4

## step 3: start anvil blockchain

```bash
# kill any existing anvil process
pkill anvil

# start fresh anvil with external access
anvil --host 0.0.0.0 --port 8545
```

keep this terminal open - anvil needs to stay running

## step 4: deploy contracts (new terminal)

```bash
cd zkETHer-Protocol

# deploy with dummy env var
export POLYGONSCAN_API_KEY=dummy && forge script script/DeployToAnvil.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --tc DeployToAnvil
```

## step 5: update contract addresses

after deployment, you'll see contract addresses in the output. update these in:

`src/services/zkETHerProtocol.ts`:

```typescript
const CONTRACT_ADDRESSES = {
  CLAIM_ISSUER: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  ZKETHER_TOKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ANVIL_RPC: 'http://YOUR_IP_FROM_STEP_2:8545'  // replace with your actual ip
};
```

## step 6: start mobile app

```bash
npx expo start -c
```

## troubleshooting

### if deployment fails with "Multiple contracts" error:
make sure you include `--tc DeployToAnvil` in the forge command

### if mobile app can't connect:
- check your ip address is correct in zkETHerProtocol.ts
- make sure anvil is running with `--host 0.0.0.0`
- verify firewall isn't blocking port 8545

### if contracts not found:
- check the deployment output for actual contract addresses
- update both CLAIM_ISSUER and ZKETHER_TOKEN addresses
- make sure you're using the right rpc url (your machine ip, not localhost)

## working deployment addresses (example)

```
MockClaimIssuer: 0x5FbDB2315678afecb367f032d93F642f64180aa3
SimplezkETHerToken: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## that's it

your local blockchain should be running and the mobile app should connect successfully. the kyc flow with secure key generation will work with real smart contracts.
