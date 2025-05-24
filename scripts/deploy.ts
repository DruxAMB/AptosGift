import { Aptos, AptosConfig, Network, Ed25519Account, Hex } from "@aptos-labs/ts-sdk";

interface CoinStoreResource {
  type: string;
  data: {
    coin: {
      value: string;
    };
  };
}
import { execSync } from "child_process";
import { writeFileSync } from "fs";

const config = new AptosConfig({ network: Network.TESTNET });
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const FAUCET_URL = "https://faucet.testnet.aptoslabs.com";

async function main() {
  try {
    console.log("🚀 Starting deployment process...");

    // Initialize the Aptos client
    const client = new Aptos(config);
    
    // Create or load deployment account
    let deployerAccount: Ed25519Account;
    try {
      // Try to load from environment
      let privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) throw new Error("No private key provided");
      
      // Format private key to be AIP-80 compliant
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      const privateKeyBytes = Hex.fromHexInput(privateKey);
      deployerAccount = new Ed25519Account({
        privateKey: privateKeyBytes
      });
      console.log("Account address:", deployerAccount.accountAddress);
    } catch (e) {
      // Create new account if no private key is provided
      deployerAccount = Ed25519Account.generate();
      console.log("❌ No private key provided. Please:");
      console.log("1. Visit https://aptoslabs.com/testnet-faucet");
      console.log(`2. Fund this address: ${deployerAccount.accountAddress}`);
      console.log("3. Re-run this script with the funded account's private key");
      process.exit(1);
    }

    // Check account balance
    const resources = await client.getAccountResources({
      accountAddress: deployerAccount.accountAddress
    });

    const aptosCoinStore = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    ) as CoinStoreResource | undefined;

    console.log("Current balance:", aptosCoinStore ? Number(aptosCoinStore.data.coin.value) / 100000000 + " APT" : "0 APT");
    
    if (!aptosCoinStore || Number(aptosCoinStore.data.coin.value) < 5000) {
      console.log("❌ Insufficient funds. Please:");
      console.log("1. Visit https://aptoslabs.com/testnet-faucet");
      console.log(`2. Fund this address: ${deployerAccount.accountAddress}`);
      console.log("3. Re-run this script once the account has testnet APT");
      process.exit(1);
    }

    // Compile the contract
    console.log("📝 Compiling contract...");
    execSync(
      `aptos move compile --package-dir move --named-addresses aptos_gifts=${deployerAccount.accountAddress}`, 
      { stdio: "inherit" }
    );

    // Deploy the contract
    console.log("📦 Deploying contract...");
    const moduleData = Uint8Array.from([]);
    const metadataData = Uint8Array.from([]);
    const codeData = Uint8Array.from([]);

    const transaction = await client.publishPackageTransaction({
      account: deployerAccount.accountAddress,
      metadataBytes: metadataData,
      moduleBytecode: [moduleData],
      options: {
        maxGasAmount: 100000
      }
    });

    const pendingTxn = await client.signAndSubmitTransaction({
      signer: deployerAccount,
      transaction,
    });
    
    const txnHash = await client.waitForTransaction({ transactionHash: pendingTxn.hash });

    console.log("✅ Contract deployed successfully!");
    console.log("📋 Transaction hash:", txnHash);
    console.log("🔑 Deployer address:", deployerAccount.accountAddress);
    
    // Save deployment info
    const deployInfo = {
      networkUrl: NODE_URL,
      deployerAddress: deployerAccount.accountAddress,
      deployerPrivateKey: process.env.PRIVATE_KEY || "new_account",
      transactionHash: txnHash,
      timestamp: new Date().toISOString(),
    };

    writeFileSync(
      "deploy-info.json",
      JSON.stringify(deployInfo, null, 2)
    );
    console.log("💾 Deployment info saved to deploy-info.json");

  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Deployment failed:", error.message);
    } else {
      console.error("❌ Deployment failed with unknown error:", error);
    }
    process.exit(1);
  }
}

main();
