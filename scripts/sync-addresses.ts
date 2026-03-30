import { syncDeploymentConfig } from "./deployment-config";

async function main() {
  const artifact = await syncDeploymentConfig();
  console.log(`Updated deployment config for ${artifact.packageId}`);
}

main().catch((error) => {
  console.error("Failed to sync addresses:", error);
  process.exit(1);
});
