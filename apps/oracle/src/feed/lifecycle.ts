import { queryBountyBoardEvents, type BountyBoardEventName, type GraphQLClientConfig } from "@bounty-board/frontier-client";
import type { LifecycleEdge, LifecycleStream, OracleConfig } from "../types";

export function buildLifecycleStreams(eventNames: readonly BountyBoardEventName[]): LifecycleStream[] {
  return eventNames.map((eventName) => ({
    streamKey: `bounty_board.${eventName}`,
    eventName
  }));
}

export async function fetchLifecycleEdges(
  config: OracleConfig,
  clientConfig: GraphQLClientConfig,
  stream: LifecycleStream,
  cursor: string | null
): Promise<LifecycleEdge[]> {
  const page = await queryBountyBoardEvents(clientConfig, {
    packageId: config.bountyBoardPackageId,
    eventName: stream.eventName,
    first: config.graphQLPageSize,
    after: cursor
  });

  return page.edges.map((edge) => ({
    cursor: edge.cursor,
    event: edge.node
  }));
}
