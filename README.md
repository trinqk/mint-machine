# MintMachine
MintMachine smart-contract

## Setup
To test or deploy, create a `.env` file

```
# Example .env file
MAINNET_INFURA_KEY=<INFURA_KEY>
MAINNET_ACCOUNT=<PRIVATE_KEY>

RINKEBY_INFURA_KEY=<INFURA_KEY>
RINKEBY_ACCOUNT=<PRIVATE_KEY>
```

## Hardhat commands
Whenever changes are made to the MintMachine.sol, run these commands

```
# Compile
npx hardhat compile

# Run tests
npx hardhat test
```

## Customization
If any of the things below are changed, you may need to fix the tests (sorry didn't spend much time on tests)

#### To change price
* Modify `price()`

#### To modify reserve amount
* Modify `reserve()`

#### To modify max mint amount
* Modify `mint()`

### Deploy
```
# Mainnet 
npx hardhat run scripts/deploy.js --network mainnet

# Rinkeby
npx hardhat run scripts/deploy.js --network rinkeby
```

### Edit Presale
To edit presale whitelist there are two requirements 
1) make a `assets/presale-list.json` with an array of addresses and amounts similar to `assets/example-presale-list.json`
2) change `CONTRACT_ADDRESS` to the address of the deployed contract

```
# Mainnet 
npx hardhat run scripts/edit-presale.js --network mainnet

# Rinkeby
npx hardhat run scripts/edit-presale.js --network rinkeby
```

### Flatten
```
npx hardhat flatten contracts/MintMachine.sol > flattened-contract/output.sol
```

### Notes
1) Set baseURI before reserving
2) When setting baseURI, make sure the baseURI it follows this format `<URL>/`. Unclude `/` at the end
