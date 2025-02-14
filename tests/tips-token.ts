import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  Account,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("tips-token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tipstoken;

  let mintPublicKey: anchor.web3.PublicKey;
  let userTokenAccount: Account;
  let recipientTokenAccount: Account;
  let recipient: Keypair;

  before(async () => {
    const payer = (provider.wallet as any).payer as Keypair;
    mintPublicKey = await createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey, // mintAuthority
      null, // freezeAuthority
      9 // decimals
    );

    userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mintPublicKey,
      provider.wallet.publicKey
    );

    recipient = Keypair.generate();
    // @note: for new account needed fund some SOL to pay fee
    const airdropSignature = await provider.connection.requestAirdrop(
      recipient.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mintPublicKey,
      recipient.publicKey
    );
  });

  it("Airdrop tokens", async () => {
    const amount = new anchor.BN(1000).mul(
      new anchor.BN(10).pow(new anchor.BN(9))
    );

    const tx = await program.methods
      .airdrop(amount)
      .accounts({
        mint: mintPublicKey,
        tokenAccount: userTokenAccount.address,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Airdrop tx signature:", tx);

    const accountInfo = await getAccount(
      provider.connection,
      userTokenAccount.address
    );
    assert.ok(
      accountInfo.amount === BigInt(1000) * BigInt(10 ** 9),
      "Баланс аирдропа должен быть 1000"
    );
  });

  it("Transfer tokens", async () => {
    const amount = new anchor.BN(500).mul(
      new anchor.BN(10).pow(new anchor.BN(9))
    );

    const tx = await program.methods
      .transfer(amount)
      .accounts({
        from: userTokenAccount.address,
        to: recipientTokenAccount.address,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Transfer tx signature:", tx);

    const senderInfo = await getAccount(
      provider.connection,
      userTokenAccount.address
    );
    const recipientInfo = await getAccount(
      provider.connection,
      recipientTokenAccount.address
    );

    assert.ok(
      senderInfo.amount === BigInt(500) * BigInt(10 ** 9),
      "Баланс отправителя должен быть 500"
    );
    assert.ok(
      recipientInfo.amount === BigInt(500) * BigInt(10 ** 9),
      "Баланс получателя должен быть 500"
    );
  });
});
