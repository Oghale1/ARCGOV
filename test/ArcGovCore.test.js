// ArcGov — arcgov.vercel.app
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArcGovCore", function () {
  let arcGov;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const ArcGovCore = await ethers.getContractFactory("ArcGovCore");
    arcGov = await ArcGovCore.deploy();
  });

  describe("Deployment", function () {
    it("should set deployer as owner", async function () {
      expect(await arcGov.owner()).to.equal(owner.address);
    });

    it("should start with proposalCount = 0", async function () {
      expect(await arcGov.proposalCount()).to.equal(0);
    });
  });

  describe("submitProposal", function () {
    it("should create a proposal and return id 1", async function () {
      await expect(arcGov.submitProposal("Title", "Desc", 0, "hash"))
        .to.emit(arcGov, "ProposalCreated");
      expect(await arcGov.proposalCount()).to.equal(1);
    });

    it("should store correct title, description, category", async function () {
      await arcGov.submitProposal("Title", "Desc", 1, "hash");
      const p = await arcGov.getProposal(1);
      expect(p.title).to.equal("Title");
      expect(p.description).to.equal("Desc");
      expect(p.category).to.equal(1);
      expect(p.ipfsHash).to.equal("hash");
    });

    it("should set isOpen to true", async function () {
      await arcGov.submitProposal("Title", "Desc", 0, "hash");
      const p = await arcGov.getProposal(1);
      expect(p.isOpen).to.equal(true);
    });

    it("should set votingDeadline to 7 days from now", async function () {
      const tx = await arcGov.submitProposal("Title", "Desc", 0, "hash");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const p = await arcGov.getProposal(1);
      expect(p.votingDeadline).to.equal(BigInt(block.timestamp + VOTING_PERIOD));
    });

    it("should emit ProposalCreated event", async function () {
      await expect(arcGov.submitProposal("Title", "Desc", 2, "hash"))
        .to.emit(arcGov, "ProposalCreated")
        .withArgs(1, owner.address, "Title", 2, anyValue);
    });

    it("should reject empty title", async function () {
      await expect(arcGov.submitProposal("", "Desc", 0, "hash"))
        .to.be.revertedWith("Title cannot be empty");
    });

    it("should increment proposalCount correctly", async function () {
      await arcGov.submitProposal("T1", "D1", 0, "H1");
      await arcGov.submitProposal("T2", "D2", 0, "H2");
      expect(await arcGov.proposalCount()).to.equal(2);
    });
  });

  describe("castVote", function () {
    beforeEach(async function () {
      await arcGov.submitProposal("Title", "Desc", 0, "hash");
    });

    it("should allow voting FOR on open proposal", async function () {
      await arcGov.connect(addr1).castVote(1, 0); // 0 = FOR in our contract logic check: actually enum is FOR, AGAINST, ABSTAIN (0, 1, 2)
      const p = await arcGov.getProposal(1);
      expect(p.forVotes).to.equal(1);
    });

    it("should allow voting AGAINST on open proposal", async function () {
      await arcGov.connect(addr1).castVote(1, 1); // 1 = AGAINST
      const p = await arcGov.getProposal(1);
      expect(p.againstVotes).to.equal(1);
    });

    it("should allow voting ABSTAIN on open proposal", async function () {
      await arcGov.connect(addr1).castVote(1, 2); // 2 = ABSTAIN
      const p = await arcGov.getProposal(1);
      expect(p.abstainVotes).to.equal(1);
    });

    it("should increment correct vote counter", async function () {
      await arcGov.connect(addr1).castVote(1, 0);
      await arcGov.connect(addr2).castVote(1, 0);
      await arcGov.connect(addr3).castVote(1, 1);
      const p = await arcGov.getProposal(1);
      expect(p.forVotes).to.equal(2);
      expect(p.againstVotes).to.equal(1);
    });

    it("should emit VoteCast event with updated counts", async function () {
      await expect(arcGov.connect(addr1).castVote(1, 0))
        .to.emit(arcGov, "VoteCast")
        .withArgs(1, addr1.address, 0, 1, 0, 0);
    });

    it("should reject double voting from same address", async function () {
      await arcGov.connect(addr1).castVote(1, 0);
      await expect(arcGov.connect(addr1).castVote(1, 0))
        .to.be.revertedWith("Already voted on this proposal");
    });

    it("should reject vote on closed proposal", async function () {
      await arcGov.closeProposal(1);
      await expect(arcGov.connect(addr1).castVote(1, 0))
        .to.be.revertedWith("Voting is already closed");
    });
  });

  describe("closeProposal", function () {
    beforeEach(async function () {
      await arcGov.submitProposal("Title", "Desc", 0, "hash");
    });

    it("should allow owner to close a proposal", async function () {
      await arcGov.closeProposal(1);
      const p = await arcGov.getProposal(1);
      expect(p.isOpen).to.equal(false);
    });

    it("should emit ProposalClosed with passed=true when FOR > AGAINST", async function () {
      await arcGov.connect(addr1).castVote(1, 0); // FOR
      await expect(arcGov.closeProposal(1))
        .to.emit(arcGov, "ProposalClosed")
        .withArgs(1, true);
    });

    it("should reject non-owner closing", async function () {
      await expect(arcGov.connect(addr1).closeProposal(1))
        .to.be.revertedWith("Caller is not the owner");
    });
  });

  describe("autoCloseIfExpired", function () {
    beforeEach(async function () {
      await arcGov.submitProposal("Title", "Desc", 0, "hash");
    });

    it("should close proposal after voting period", async function () {
      await time.increase(VOTING_PERIOD + 1);
      await arcGov.autoCloseIfExpired(1);
      const p = await arcGov.getProposal(1);
      expect(p.isOpen).to.equal(false);
    });

    it("should not close before deadline", async function () {
      await expect(arcGov.autoCloseIfExpired(1))
        .to.be.revertedWith("Voting deadline has not passed yet");
    });
  });

  describe("getProposal + getAllProposals", function () {
    it("should return empty array when no proposals", async function () {
      const all = await arcGov.getAllProposals();
      expect(all.length).to.equal(0);
    });

    it("should return all proposals after multiple submits", async function () {
      await arcGov.submitProposal("T1", "D1", 0, "H1");
      await arcGov.submitProposal("T2", "D2", 0, "H2");
      const all = await arcGov.getAllProposals();
      expect(all.length).to.equal(2);
      expect(all[0].title).to.equal("T1");
      expect(all[1].title).to.equal("T2");
    });
  });

  describe("hasVotedOn", function () {
    beforeEach(async function () {
      await arcGov.submitProposal("Title", "Desc", 0, "hash");
    });

    it("should return false before voting", async function () {
      expect(await arcGov.hasVotedOn(1, addr1.address)).to.equal(false);
    });

    it("should return true after voting", async function () {
      await arcGov.connect(addr1).castVote(1, 0);
      expect(await arcGov.hasVotedOn(1, addr1.address)).to.equal(true);
    });
  });
});

// Helper for event matching
const anyValue = () => true;
