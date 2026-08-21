/**
 * Deploy script — Liverome
 * ------------------------
 * Usage:
 *   npx ts-node deploy/deploy.ts studio      -> deploy sur GenLayer Studio
 *   npx ts-node deploy/deploy.ts bradbury    -> deploy sur Testnet Bradbury
 *
 * Avant de lancer sur "bradbury": mets ta clé privée testnet dans
 * process.env.LIVEROME_PRIVATE_KEY (jamais en dur dans le code !),
 * et assure-toi d'avoir du GEN testnet via le faucet.
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet, testnetBradbury } from "genlayer-js/chains";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

async function main() {
  const target = process.argv[2] || "studio"; // "studio" | "bradbury"
  const chain = target === "bradbury" ? testnetBradbury : studionet;

  console.log(`--> Deploying Liverome on: ${target} (${chain.name ?? target})`);

  // Sur Studio, une clé générée à la volée suffit (fonds simulés).
  // Sur Bradbury, utilise une vraie clé testnet (via env var) pour garder
  // la même adresse / le même wallet entre plusieurs déploiements.
  const privateKey = process.env.LIVEROME_PRIVATE_KEY;
  const account = privateKey ? createAccount(privateKey as `0x${string}`) : createAccount();

  const client = createClient({
    chain,
    account,
  });

  // Nécessaire avant le tout premier déploiement sur un réseau donné
  await client.initializeConsensusSmartContract();

  const contractCode = readFileSync(
    path.join(__dirname, "..", "contracts", "liverome.py"),
    "utf-8"
  );

  console.log("--> Sending deployment transaction...");
  const deployTxHash = await client.deployContract({
    code: contractCode,
    args: [], // __init__ du contrat ne prend aucun argument
  });

  console.log("--> Waiting for receipt (this can take a bit on Bradbury)...");
  const receipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    status: "ACCEPTED",
  });

  const contractAddress = receipt.data?.contract_address ?? receipt.contractAddress;
  console.log("✅ Liverome deployed at:", contractAddress);
  console.log("   Account used:", account.address);

  // Sauvegarde l'adresse pour le frontend
  const outFile = path.join(__dirname, "deployed-address.json");
  writeFileSync(
    outFile,
    JSON.stringify({ network: target, address: contractAddress, deployedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`--> Address saved to ${outFile}`);
  console.log("--> Copy this into frontend/.env.local as NEXT_PUBLIC_CONTRACT_ADDRESS");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
