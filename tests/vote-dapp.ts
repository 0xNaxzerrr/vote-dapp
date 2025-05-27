import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VoteApp } from "../target/types/vote_app";
import { SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("vote-app", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VoteApp as Program<VoteApp>;

  // We'll reuse these keypairs across tests
  const proposal = Keypair.generate();
  const voter = Keypair.generate();

  // Helper function to get current timestamp
  const getCurrentTimestamp = (): number => {
    return Math.floor(Date.now() / 1000);
  };

  // Helper function to get a future timestamp
  const getFutureTimestamp = (secondsInFuture: number): number => {
    return getCurrentTimestamp() + secondsInFuture;
  };

  before(async () => {
    // Airdrop some SOL to the voter for transaction fees
    const signature = await provider.connection.requestAirdrop(
      voter.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  describe("create_proposal", () => {
    it("successfully creates a proposal", async () => {
      const title = "Favorite Programming Language?";
      const description = "Vote for your preferred programming language";
      const choices = ["Rust", "TypeScript", "Python"];
      const deadline = new anchor.BN(getFutureTimestamp(3600)); // 1 hour from now

      const tx = await program.methods
        .createProposal(title, description, choices, deadline)
        .accounts({
          proposal: proposal.publicKey,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([proposal])
        .rpc();

      // Fetch the created proposal
      const proposalAccount = await program.account.proposal.fetch(
        proposal.publicKey
      );

      // Verify the proposal data
      assert.equal(proposalAccount.title, title);
      assert.equal(proposalAccount.description, description);
      assert.equal(proposalAccount.choices.length, choices.length);
      assert.equal(proposalAccount.deadline.toString(), deadline.toString());

      // Verify each choice
      proposalAccount.choices.forEach((choice, index) => {
        assert.equal(choice.label, choices[index]);
        assert.equal(choice.count.toString(), "0");
      });
    });

    it("fails when choices exceed MAX_CHOICES", async () => {
      const tooManyChoices = ["1", "2", "3", "4", "5", "6"]; // MAX_CHOICES is 5
      const newProposal = Keypair.generate();

      try {
        await program.methods
          .createProposal(
            "Test",
            "Test Description",
            tooManyChoices,
            new anchor.BN(getFutureTimestamp(3600))
          )
          .accounts({
            proposal: newProposal.publicKey,
            signer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newProposal])
          .rpc();
        assert.fail("Should have failed with too many choices");
      } catch (error) {
        assert.include(error.message, "MaxLengthChoices");
      }
    });
  });

  describe("cast_vote", () => {
    // We'll create a new proposal for voting tests
    let votingProposal: Keypair;
    let proposalDeadline: anchor.BN;

    beforeEach(async () => {
      votingProposal = Keypair.generate();
      proposalDeadline = new anchor.BN(getFutureTimestamp(3600));

      // Create a new proposal for each test
      await program.methods
        .createProposal(
          "Test Proposal",
          "Test Description",
          ["Option 1", "Option 2"],
          proposalDeadline
        )
        .accounts({
          proposal: votingProposal.publicKey,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([votingProposal])
        .rpc();
    });

    it("successfully casts a vote", async () => {
      // Calculate PDA for voter account
      const [voterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [votingProposal.publicKey.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );

      const userChoice = 0; // Voting for first option

      await program.methods
        .castVote(userChoice)
        .accounts({
          proposal: votingProposal.publicKey,
          voter: voterPDA,
          signer: voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      // Verify the vote was recorded
      const proposalAccount = await program.account.proposal.fetch(
        votingProposal.publicKey
      );
      assert.equal(proposalAccount.choices[userChoice].count.toString(), "1");

      // Verify voter account
      const voterAccount = await program.account.voter.fetch(voterPDA);
      assert.equal(voterAccount.proposal.toString(), votingProposal.publicKey.toString());
      assert.equal(voterAccount.user.toString(), voter.publicKey.toString());
      assert.equal(voterAccount.choiceOption, userChoice);
    });

    it("fails when voting for invalid option", async () => {
      const [voterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [votingProposal.publicKey.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );

      const invalidChoice = 99; // Invalid option index

      try {
        await program.methods
          .castVote(invalidChoice)
          .accounts({
            proposal: votingProposal.publicKey,
            voter: voterPDA,
            signer: voter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter])
          .rpc();
        assert.fail("Should have failed with invalid option");
      } catch (error) {
        assert.include(error.message, "InvalidOption");
      }
    });

    it("fails when voting after deadline", async () => {
      // Create a proposal with passed deadline
      const expiredProposal = Keypair.generate();
      const passedDeadline = new anchor.BN(getCurrentTimestamp() - 3600); // 1 hour ago

      await program.methods
        .createProposal(
          "Expired Proposal",
          "Test Description",
          ["Option 1", "Option 2"],
          passedDeadline
        )
        .accounts({
          proposal: expiredProposal.publicKey,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([expiredProposal])
        .rpc();

      const [voterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [expiredProposal.publicKey.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .castVote(0)
          .accounts({
            proposal: expiredProposal.publicKey,
            voter: voterPDA,
            signer: voter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter])
          .rpc();
        assert.fail("Should have failed with deadline passed");
      } catch (error) {
        assert.include(error.message, "DeadlinePassed");
      }
    });

    it("allows multiple users to vote", async () => {
      const voter2 = Keypair.generate();
      
      // Airdrop some SOL to the second voter
      const signature = await provider.connection.requestAirdrop(
        voter2.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);

      // First voter votes for option 0
      const [voterPDA1] = anchor.web3.PublicKey.findProgramAddressSync(
        [votingProposal.publicKey.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .castVote(0)
        .accounts({
          proposal: votingProposal.publicKey,
          voter: voterPDA1,
          signer: voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      // Second voter votes for option 1
      const [voterPDA2] = anchor.web3.PublicKey.findProgramAddressSync(
        [votingProposal.publicKey.toBuffer(), voter2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .castVote(1)
        .accounts({
          proposal: votingProposal.publicKey,
          voter: voterPDA2,
          signer: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      // Verify both votes were recorded
      const proposalAccount = await program.account.proposal.fetch(
        votingProposal.publicKey
      );
      assert.equal(proposalAccount.choices[0].count.toString(), "1");
      assert.equal(proposalAccount.choices[1].count.toString(), "1");
    });
  });

  describe("query proposals", () => {
    it("can fetch all proposals", async () => {
      const allProposals = await program.account.proposal.all();
      console.log("Total number of proposals:", allProposals.length);
      
      // Log details of each proposal
      allProposals.forEach((p, index) => {
        console.log(`\nProposal ${index + 1}:`);
        console.log("Title:", p.account.title);
        console.log("Description:", p.account.description);
        console.log("Choices:", p.account.choices.map(c => `${c.label}: ${c.count}`));
        console.log("Deadline:", new Date(p.account.deadline.toNumber() * 1000).toISOString());
      });
    });

    it("can fetch proposals by creator", async () => {
      const creatorProposals = await program.account.proposal.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: provider.wallet.publicKey.toBase58(),
          },
        },
      ]);
      
      console.log(
        "Number of proposals by current wallet:",
        creatorProposals.length
      );
    });
  });

  describe("delete_proposal", () => {
    let expiredProposal: Keypair;
    
    beforeEach(async () => {
      expiredProposal = Keypair.generate();
      // Create a proposal with a deadline more than 1 month ago
      const oneMonthAndADayAgo = new anchor.BN(
        getCurrentTimestamp() - (31 * 24 * 60 * 60) // 31 days ago
      );

      await program.methods
        .createProposal(
          "Expired Proposal",
          "This proposal will be deleted",
          ["Option 1", "Option 2"],
          oneMonthAndADayAgo
        )
        .accounts({
          proposal: expiredProposal.publicKey,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([expiredProposal])
        .rpc();
    });

    it("successfully deletes an expired proposal", async () => {
      // Get the initial balance of the signer
      const initialBalance = await provider.connection.getBalance(provider.wallet.publicKey);

      // Delete the proposal
      await program.methods
        .deleteProposal()
        .accounts({
          proposal: expiredProposal.publicKey,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Verify the proposal account no longer exists
      const proposalAccount = await provider.connection.getAccountInfo(expiredProposal.publicKey);
      assert.isNull(proposalAccount, "Proposal account should be deleted");

      // Verify the rent was returned to the signer
      const finalBalance = await provider.connection.getBalance(provider.wallet.publicKey);
      assert.isTrue(finalBalance > initialBalance, "Signer should receive rent from closed account");
    });

    it("fails to delete a proposal that is not expired for more than a month", async () => {
      const recentProposal = Keypair.generate();
      const futureDeadline = new anchor.BN(
        getCurrentTimestamp() + (24 * 60 * 60) // 1 day in the future
      );

      // Create a proposal with a recent deadline
      await program.methods
        .createProposal(
          "Recent Proposal",
          "This proposal cannot be deleted yet",
          ["Option 1", "Option 2"],
          futureDeadline
        )
        .accounts({
          proposal: recentProposal.publicKey,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([recentProposal])
        .rpc();

      // Try to delete the proposal
      try {
        await program.methods
          .deleteProposal()
          .accounts({
            proposal: recentProposal.publicKey,
            signer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have failed to delete non-expired proposal");
      } catch (error) {
        assert.include(error.message, "ProposalNotExpiredEnough");
      }
    });
  });
});
