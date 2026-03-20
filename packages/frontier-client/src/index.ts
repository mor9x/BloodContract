import { queryKillmailEvents } from "./queries/killmail";
import { queryBountyBoardEvents } from "./queries/bounty-board";
import { getBoardRegistrySnapshot, getBoardState } from "./queries/board-state";
import { utopiaEnvironment } from "./constants";
import type { GraphQLClientConfig } from "./graphql/client";
import { createSuiReadClient, type SuiReadClient } from "./rpc/client";
import type { QueryBountyBoardEventsArgs } from "./queries/bounty-board";
import type { GetBoardStateArgs } from "./queries/board-state";
import type { QueryKillmailEventsArgs } from "./queries/killmail";
import type { ConnectionPage } from "./types/graphql";
import type { BountyBoardLifecycleEvent } from "./types/bounty-board";
import type { BoardState } from "./types/board-state";
import type { BoardRegistrySnapshot } from "./types/board-state";
import type { KillmailEvent } from "./types/killmail";

export type FrontierClientConfig = Partial<GraphQLClientConfig> & {
  rpcUrl?: string;
  suiClient?: SuiReadClient;
};

export type FrontierClient = {
  environment: typeof utopiaEnvironment;
  queryKillmailEvents: (args: QueryKillmailEventsArgs) => Promise<ConnectionPage<KillmailEvent>>;
  queryBountyBoardEvents: (args: QueryBountyBoardEventsArgs) => Promise<ConnectionPage<BountyBoardLifecycleEvent>>;
  getBoardState: (args: GetBoardStateArgs) => Promise<BoardState>;
  getBoardRegistrySnapshot: (args: GetBoardStateArgs) => Promise<BoardRegistrySnapshot>;
};

export function createFrontierClient(config: FrontierClientConfig = {}): FrontierClient {
  const graphQLConfig: GraphQLClientConfig = {
    endpoint: config.endpoint ?? utopiaEnvironment.graphqlUrl,
    headers: config.headers
  };
  const suiClient = config.suiClient ?? createSuiReadClient(config.rpcUrl ?? utopiaEnvironment.suiRpcUrl);

  return {
    environment: utopiaEnvironment,
    queryKillmailEvents: (args) => queryKillmailEvents(graphQLConfig, args),
    queryBountyBoardEvents: (args) => queryBountyBoardEvents(graphQLConfig, args),
    getBoardState: (args) => getBoardState(suiClient, args),
    getBoardRegistrySnapshot: (args) => getBoardRegistrySnapshot(suiClient, args)
  };
}

export { utopiaEnvironment } from "./constants";
export { createSuiReadClient } from "./rpc/client";
export { getBountyBoardEventType, queryBountyBoardEvents } from "./queries/bounty-board";
export { getBoardRegistrySnapshot, getBoardState } from "./queries/board-state";
export { getKillmailCreatedEventType, queryKillmailEvents } from "./queries/killmail";
export type { BountyBoardEventName, BountyBoardLifecycleEvent } from "./types/bounty-board";
export type { ActiveInsuranceBoardRecord, ActiveMultiBoardRecord, ActiveSingleBoardRecord, BoardRegistrySnapshot, BoardState } from "./types/board-state";
export type { KillmailEvent, TenantItemIdJson } from "./types/killmail";
export type { ConnectionEdge, ConnectionPage, PageInfo } from "./types/graphql";
export type { GraphQLClientConfig } from "./graphql/client";
export type { SuiReadClient } from "./rpc/client";
