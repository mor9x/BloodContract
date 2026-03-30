import { env } from "./runtime";

const identityWorldPackageId = env("VITE_WORLD_PACKAGE") ?? "";
const simulationWorldPackageId = env("VITE_SIMULATION_WORLD_PACKAGE") ?? "";
const bountyBoardPackageId = env("VITE_BOUNTY_BOARD_PACKAGE") ?? "";
const boardId = env("VITE_BOARD_ID") ?? "";
const worldObjectRegistryId = env("VITE_WORLD_OBJECT_REGISTRY_ID") ?? "";

export const utopiaEnvironment = {
  network: env("VITE_SUI_NETWORK") ?? "testnet",
  graphqlUrl: env("VITE_SUI_GRAPHQL_URL") ?? "https://graphql.testnet.sui.io/graphql",
  suiRpcUrl: env("VITE_SUI_RPC_URL") ?? "https://fullnode.testnet.sui.io:443",
  worldApiUrl: env("VITE_WORLD_API_URL") ?? "https://world-api-utopia.uat.pub.evefrontier.com",
  identityWorldPackageId,
  simulationWorldPackageId,
  simulationWorldAdminAclId: env("VITE_SIMULATION_WORLD_ADMIN_ACL_ID") ?? "",
  simulationWorldKillmailRegistryId: env("VITE_SIMULATION_WORLD_KILLMAIL_REGISTRY_ID") ?? "",
  bountyBoardPackageId,
  boardId,
  clockObjectId: env("VITE_CLOCK_OBJECT_ID") ?? "0x6",
  worldPackageId: identityWorldPackageId,
  worldObjectRegistryId,
  customCoinTypeHint: env("VITE_CUSTOM_COIN_TYPE_HINT") ?? ""
} as const;
