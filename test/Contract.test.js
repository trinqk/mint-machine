const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Contract tests", function () {
  const contractName = "MintMachine";
  const contractSymbol = "MINT";

  const reserveAmount = 50;
  const maxPurchaseAmount = 10;

  let Contract;
  let hardhatContract;
  let owner;
  let addr1;

  beforeEach(async function () {
    Contract = await ethers.getContractFactory("MintMachine");
    [owner, addr1] = await ethers.getSigners();

    hardhatContract = await Contract.deploy(
      "MintMachine",
      "MINT",
      reserveAmount + 1
    );
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await hardhatContract.owner()).to.equal(owner.address);
    });

    it("Should set the correct contract name, symbol, saleActive, and PROVENANCE", async function () {
      expect(await hardhatContract.name()).to.equal(contractName);
      expect(await hardhatContract.symbol()).to.equal(contractSymbol);
      expect(await hardhatContract.saleActive()).to.equal(false);
      expect(await hardhatContract.PROVENANCE()).to.equal("");
    });
  });

  describe("Reserve", function () {
    it("Should revert if not owner", async function () {
      expect(hardhatContract.connect(addr1).reserve()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should reserve 50 tokens successfully", async function () {
      await hardhatContract.reserve();
      for (let i = 0; i < reserveAmount; i++) {
        expect(await hardhatContract.ownerOf(i)).to.equal(owner.address);
      }
    });
  });

  describe("Whitelist", function () {
    const whiteListAddress = "0x000000000000000000000000000000000000dEaD";

    it("Should revert if not owner", async function () {
      expect(
        hardhatContract.connect(addr1).editPresale([whiteListAddress], [1])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should whitelist addresses successfully", async function () {
      await hardhatContract.editPresale([whiteListAddress], [1]);
      expect(
        await hardhatContract.presaleWhitelist(whiteListAddress)
      ).to.equal(1);

      await hardhatContract.editPresale([whiteListAddress], [20]);
      expect(
        await hardhatContract.presaleWhitelist(whiteListAddress)
      ).to.equal(20);

      await hardhatContract.editPresale([whiteListAddress], [0]);
      expect(
        await hardhatContract.presaleWhitelist(whiteListAddress)
      ).to.equal(0);
    });
  });

  describe("Mint", function () {
    it("Should revert if sale is not active", async function () {
      expect(hardhatContract.mint(1)).to.be.revertedWith(
        "Sale must be active to mint"
      );
    });

    it("Should revert if number of mints exceeds maxPurchaseAmount", async function () {
      await hardhatContract.toggleSale();
      expect(
        hardhatContract.mint(maxPurchaseAmount + 1)
      ).to.be.revertedWith("Invalid purchase amount");
    });

    it("Should revert if mint exceeds maxSupply", async function () {
      await hardhatContract.toggleSale();
      await hardhatContract.reserve();
      expect(hardhatContract.mint(maxPurchaseAmount)).to.be.revertedWith(
        "Purchase would exceed max supply of tokens"
      );
    });

    it("Should revert if minter does not send enough ether", async function () {
      await hardhatContract.toggleSale();
      expect(
        hardhatContract.mint(maxPurchaseAmount, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("Ether value sent is not correct");
    });

    it("Should mint successfully", async function () {
      await hardhatContract.toggleSale();
      await hardhatContract
        .connect(addr1)
        .mint(maxPurchaseAmount, { value: ethers.utils.parseEther("0.6") });
      for (let i = 0; i < maxPurchaseAmount; i++) {
        expect(await hardhatContract.ownerOf(i)).to.equal(addr1.address);
      }
    });
  });

  describe("MintPresale", function () {
    it("Should revert if preSale is not active", async function () {
      expect(hardhatContract.mintPresale(1)).to.be.revertedWith(
        "Presale must be active to mint"
      );
    });

    it("Should revert if number of no tokens are reserved for the address", async function () {
      await hardhatContract.togglePresale();
      expect(
        hardhatContract.mintPresale(maxPurchaseAmount + 1)
      ).to.be.revertedWith("No tokens reserved for this address");
    });

    it("Should revert if number of mints exceeds reserved amount", async function () {
      await hardhatContract.editPresale([owner.address], [1]);
      await hardhatContract.togglePresale();
      expect(
        hardhatContract.mintPresale(maxPurchaseAmount + 1)
      ).to.be.revertedWith("Can't mint more than reserved");
    });

    it("Should revert if minter does not send enough ether", async function () {
      await hardhatContract.editPresale([owner.address], [1]);
      await hardhatContract.togglePresale();
      expect(
        hardhatContract.mintPresale(1, { value: ethers.utils.parseEther("0.01") })
      ).to.be.revertedWith("Ether value sent is not correct");
    });

    it("Should mint presale successfully", async function () {
      await hardhatContract.editPresale([owner.address], [1]);
      await hardhatContract.togglePresale();
      await hardhatContract.mintPresale(1, { value: ethers.utils.parseEther("0.06") })
      expect(await hardhatContract.ownerOf(0)).to.equal(owner.address);
      expect(await hardhatContract.presaleWhitelist(owner.address)).to.equal(0);
    });
  });

  describe("WalletOfOwner", function () {
    it("Should return an empty wallet", async function () {
      expect(
        await hardhatContract.walletOfOwner(owner.address)
      ).to.deep.equal([]);
    });

    it("Should return the correct wallets", async function () {
      await hardhatContract.toggleSale();
      await hardhatContract.mint(3, { value: ethers.utils.parseEther("0.18") });
      await hardhatContract
        .connect(addr1)
        .mint(3, { value: ethers.utils.parseEther("0.18") });
      await hardhatContract.mint(3, { value: ethers.utils.parseEther("0.18") });
      await hardhatContract
        .connect(addr1)
        .mint(3, { value: ethers.utils.parseEther("0.18") });
      expect(
        await hardhatContract.walletOfOwner(owner.address)
      ).to.have.length(6);
      expect(
        await hardhatContract.walletOfOwner(addr1.address)
      ).to.have.length(6);
    });
  });

  describe("Withdraw", function () {
    it("Should revert if not owner", async function () {
      expect(
        hardhatContract.connect(addr1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should withdraw successfully", async function () {
      const initialBalance = parseFloat(
        ethers.utils.formatEther(await owner.getBalance())
      );

      await hardhatContract.toggleSale();
      await hardhatContract
        .connect(addr1)
        .mint(maxPurchaseAmount, { value: ethers.utils.parseEther("0.6") });
      await hardhatContract.withdraw();

      const newBalance = parseFloat(
        ethers.utils.formatEther(await owner.getBalance())
      );
      // Gas fees may vary for every operation on the contract.
      expect(newBalance).to.be.greaterThan(initialBalance);
    });
  });

  describe("SaleActive", function () {
    it("Should revert if not owner", async function () {
      expect(
        hardhatContract.connect(addr1).toggleSale()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should toggle saleActive", async function () {
      await hardhatContract.toggleSale();
      expect(await hardhatContract.saleActive()).to.equal(true);
    });
  });

  describe("Price", function () {
    it("Should revert if not owner", async function () {
      expect(
        hardhatContract.connect(addr1).setPrice("10000000000000000")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should set price", async function () {
      await hardhatContract.setPrice("10000000000000000");
      expect(await hardhatContract.price()).to.equal("10000000000000000");
    });
  });

  describe("Provenance", function () {
    it("Should revert if not owner", async function () {
      expect(
        hardhatContract.connect(addr1).setProvenance("YMLabs")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should set PROVENANCE", async function () {
      await hardhatContract.setProvenance(contractName);
      expect(await hardhatContract.PROVENANCE()).to.equal(contractName);
    });
  });

  describe("BaseURI", function () {
    it("Should revert if not owner", async function () {
      expect(
        hardhatContract.connect(addr1).setBaseURI(contractName)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should set baseURI", async function () {
      await hardhatContract.setBaseURI(contractName);
      await hardhatContract.reserve();
      for (let i = 0; i < reserveAmount; i++) {
        expect(await hardhatContract.tokenURI(i)).to.equal(contractName + i);
      }
    });
  });
});
