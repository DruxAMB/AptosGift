import { Aptos, AptosConfig, Network, Ed25519Account, Hex } from "@aptos-labs/ts-sdk";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Create a log function that writes to both console and file
function log(message: string) {
  console.log(message);
  fs.appendFileSync('deployment.log', message + '\n');
}

interface CoinStoreResource {
  type: string;
  data: {
    coin: {
      value: string;
    };
  };
}

const config = new AptosConfig({ network: Network.TESTNET });
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const FAUCET_URL = "https://faucet.testnet.aptoslabs.com";

async function main() {
  // Clear previous log
  if (fs.existsSync('deployment.log')) {
    fs.unlinkSync('deployment.log');
  }
  log("=== AptosGifts Deployment Script ===");
  log("Current time: " + new Date().toISOString());
  try {
    log("DEBUG MODE: ON");
    log("🚀 Starting deployment process...");

    // Initialize the Aptos client
    const client = new Aptos(config);
    log("Network: " + config.network);
    
    // Create or load deployment account
    let deployerAccount: Ed25519Account;
    try {
      // Try to load from environment
      let privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) throw new Error("No private key provided");
      
      // Initialize deployer account with private key
      deployerAccount = new Ed25519Account({
        privateKey: Hex.fromHexInput("843bb39a911a0645c2ad5e5054cc62bd28c727c7b157845ba27321c84faf12a1")
      });
      log("Account address: " + deployerAccount.accountAddress);
    } catch (e) {
      // Create new account if no private key is provided
      deployerAccount = Ed25519Account.generate();
      log("❌ No private key provided. Please:");
      log("1. Visit https://aptoslabs.com/testnet-faucet");
      log(`2. Fund this address: ${deployerAccount.accountAddress}`);
      log("3. Re-run this script with the funded account's private key");
      process.exit(1);
    }

    // Check account balance
    const resources = await client.getAccountResources({
      accountAddress: deployerAccount.accountAddress
    });

    const aptosCoinStore = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    ) as CoinStoreResource | undefined;

    log("Current balance: " + (aptosCoinStore ? Number(aptosCoinStore.data.coin.value) / 100000000 + " APT" : "0 APT"));
    
    if (!aptosCoinStore || Number(aptosCoinStore.data.coin.value) < 5000) {
      log("❌ Insufficient funds. Please:");
      log("1. Visit https://aptoslabs.com/testnet-faucet");
      log(`2. Fund this address: ${deployerAccount.accountAddress}`);
      log("3. Re-run this script once the account has testnet APT");
      process.exit(1);
    }

    // Check if account exists on chain
    try {
      const accountInfo = await client.getAccountInfo({ accountAddress: deployerAccount.accountAddress });
      log("✅ Account exists on chain");
      log("Account sequence number: " + accountInfo.sequence_number);
    } catch (e) {
      log("❌ Account does not exist on chain. Please fund it first.");
      process.exit(1);
    }

    // Compile the contract
    log("📝 Compiling contract...");
    try {
      execSync(
        `C:/Users/LOYAL/.aptoscli/bin/aptos.exe move compile --package-dir move --named-addresses aptos_gifts=${deployerAccount.accountAddress}`, 
        { stdio: "inherit" }
      );
      log("✅ Compilation successful!");
    } catch (error) {
      log("❌ Compilation failed: " + error);
      process.exit(1);
    }

    // Deploy the module
    log("📦 Deploying Gift Card module...");
    
    // Get the compiled module bytecode
    const projectRoot = path.resolve(__dirname, '..');
    const buildPath = path.join(projectRoot, 'move', 'build', 'aptos_gifts', 'bytecode_modules');
    
    try {
      log("Build path: " + buildPath);
      // Check if build directory exists
      if (!fs.existsSync(buildPath)) {
        log("❌ Build directory not found. Please compile the contract first.");
        log("Run: cd move && aptos move compile");
        process.exit(1);
      }
      
      const modulePath = path.join(buildPath, 'gift_card.mv');
      if (!fs.existsSync(modulePath)) {
        log("❌ Compiled module not found. Please compile the contract first.");
        log("Run: cd move && aptos move compile");
        process.exit(1);
      }
      
      // Read the module bytecode
      const moduleBytes = fs.readFileSync(modulePath);
      log(`📄 Module bytecode loaded (${moduleBytes.length} bytes)`); 
      
      // Deploy the module using the Aptos TS SDK
      const transaction = await client.publishPackageTransaction({
        account: deployerAccount,
        metadataBytes: fs.readFileSync(path.join(projectRoot, 'move', 'build', 'aptos_gifts', 'package-metadata.bcs')),
        moduleBytecodes: [moduleBytes],
      });
      
      // Sign and submit the transaction
      const pendingTx = await client.signAndSubmitTransaction({
        signer: deployerAccount,
        transaction
      });
      log("Transaction submitted. Hash: " + pendingTx.hash);
      
      // Wait for transaction
      const txResult = await client.waitForTransaction({ transactionHash: pendingTx.hash });
      log("Transaction status: " + (txResult.success ? "✅ Success" : "❌ Failed"));
      
      if (txResult.success) {
        log("✅ Gift Card module deployed successfully!");
        log("Module address: " + deployerAccount.accountAddress);
        log("Explorer URL: https://explorer.aptoslabs.com/account/" + deployerAccount.accountAddress + "?network=testnet");
      } else {
        log("❌ Deployment failed. VM Status: " + txResult.vm_status);
      }
    } catch (error) {
      log("❌ Deployment error: " + error);
      process.exit(1);
    }

    // Save deployment info
    const deployInfo = {
      networkUrl: NODE_URL,
      deployerAddress: deployerAccount.accountAddress,
      deployerPrivateKey: "843bb39a911a0645c2ad5e5054cc62bd28c727c7b157845ba27321c84faf12a1",
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      "deploy-info.json",
      JSON.stringify(deployInfo, null, 2)
    );
    log("💾 Deployment info saved to deploy-info.json");

  } catch (error) {
    if (error instanceof Error) {
      log("❌ Deployment failed: " + error.message);
    } else {
      log("❌ Deployment failed with unknown error: " + error);
    }
    process.exit(1);
  }
}

main();
