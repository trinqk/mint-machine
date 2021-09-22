const { ethers } = require("hardhat");

const CONTRACT_SUPPLY = 10000;

async function main() {
  const [owner] = await ethers.getSigners();

  console.log("Deploying contract with the account:", owner.address);

  const MintMachine = await ethers.getContractFactory("MintMachine");
  const machineInstance = await MintMachine.deploy("MintMachine", "MINT", CONTRACT_SUPPLY);

  await machineInstance.deployed();
  console.log("Contract deployed to: ", machineInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
