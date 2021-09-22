const { ethers } = require("hardhat");
const contract = require("../artifacts/contracts/MintMachine.sol/MintMachine.json");
const presaleList = require("../assets/presale-list.json");

const CONTRACT_ADDRESS = "<ADDRESS HERE>";

async function main() {
  const [owner] = await ethers.getSigners();

  const machineInstance = new ethers.Contract(
    CONTRACT_ADDRESS,
    contract["abi"],
    owner
  );

  const addresses = [];
  const amounts = [];

  presaleList.map(entry => {
    addresses.push(entry.address);
    amounts.push(entry.amount);
  });

  const tx = await machineInstance.editPresale(addresses, amounts);
  console.log("[PRESALE EDIT SUBMITTED] tx: " + tx["hash"]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
