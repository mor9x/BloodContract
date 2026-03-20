import { createSuiReadClient, getBoardRegistrySnapshot, type GraphQLClientConfig } from "@bounty-board/frontier-client";
import { BOUNTY_EVENT_STREAMS, KILLMAIL_STREAM } from "./constants";
import { loadOracleConfig } from "./config";
import { OracleStore, buildProcessedActionKey, oracleStreamKeys } from "./db/store";
import { fetchKillmailEdges } from "./feed/killmail";
import { buildLifecycleStreams, fetchLifecycleEdges } from "./feed/lifecycle";
import { startHealthServer } from "./http";
import { matchKillmailEvent } from "./matcher";
import { OracleWriter } from "./writer";

type LifecycleSyncResult = {
  didWork: boolean;
  perStreamCounts: Record<string, number>;
};

type KillmailSyncResult = {
  didWork: boolean;
  killmailCount: number;
  actionCount: number;
};

function logInfo(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[oracle] ${message}`, details);
    return;
  }

  console.info(`[oracle] ${message}`);
}

function actionSummary(action: ReturnType<typeof matchKillmailEvent>[number]) {
  if (action.kind === "settle-single") {
    return {
      kind: action.kind,
      objectId: action.objectId,
      killmailItemId: action.killmailItemId,
      hunterCharacterObjectId: action.hunterCharacterObjectId
    };
  }

  if (action.kind === "record-multi-kill") {
    return {
      kind: action.kind,
      objectId: action.objectId,
      killmailItemId: action.killmailItemId,
      hunterCharacterObjectId: action.hunterCharacterObjectId,
      nextRecordedKills: action.nextRecordedKills,
      targetKills: action.targetKills
    };
  }

  return {
    kind: action.kind,
    objectId: action.objectId,
    killmailItemId: action.killmailItemId,
    killerCharacterObjectId: action.killerCharacterObjectId
  };
}

async function syncLifecycle(
  store: OracleStore,
  config: ReturnType<typeof loadOracleConfig>,
  graphQLConfig: GraphQLClientConfig
): Promise<LifecycleSyncResult> {
  let didWork = false;
  const perStreamCounts: Record<string, number> = {};

  for (const stream of buildLifecycleStreams(BOUNTY_EVENT_STREAMS)) {
    const cursor = store.getCursor(stream.streamKey);
    const edges = await fetchLifecycleEdges(config, graphQLConfig, stream, cursor);
    perStreamCounts[stream.streamKey] = edges.length;

    for (const edge of edges) {
      store.applyLifecycleEvent(stream.streamKey, edge.cursor, edge.event);
      didWork = true;
    }
  }

  return { didWork, perStreamCounts };
}

async function syncKillmail(
  store: OracleStore,
  writer: OracleWriter,
  config: ReturnType<typeof loadOracleConfig>,
  graphQLConfig: GraphQLClientConfig
): Promise<KillmailSyncResult> {
  let didWork = false;
  let actionCount = 0;
  const cursor = store.getCursor(KILLMAIL_STREAM);
  const edges = await fetchKillmailEdges(config, graphQLConfig, cursor);

  for (const edge of edges) {
    const actions = matchKillmailEvent(config, store.snapshot(), edge.event);

    for (const action of actions) {
      const actionKey = buildProcessedActionKey(action);
      if (store.hasProcessedAction(actionKey)) {
        continue;
      }

      logInfo("writing oracle action", actionSummary(action));
      const digest = await writer.execute(action);
      logInfo("oracle write succeeded", {
        kind: action.kind,
        objectId: action.objectId,
        killmailItemId: action.killmailItemId,
        digest
      });
      store.recordSuccessfulAction(action, digest);
      didWork = true;
      actionCount += 1;
    }

    store.recordKillmailProcessed(edge.cursor);
    didWork = true;
  }

  return {
    didWork,
    killmailCount: edges.length,
    actionCount
  };
}

async function main() {
  const config = loadOracleConfig();
  const store = new OracleStore(config.dbPath);
  const writer = new OracleWriter(config);
  const suiReadClient = createSuiReadClient(config.grpcUrl);
  const graphQLConfig: GraphQLClientConfig = {
    endpoint: config.graphQLEndpoint
  };
  const streamKeys = oracleStreamKeys(BOUNTY_EVENT_STREAMS.map((eventName) => `bounty_board.${eventName}`));
  const server = startHealthServer(store, config.healthPort, streamKeys);
  let idleCycles = 0;

  logInfo("oracle started", {
    network: config.network,
    graphQLEndpoint: config.graphQLEndpoint,
    grpcUrl: config.grpcUrl,
    worldPackageId: config.worldPackageId,
    bountyBoardPackageId: config.bountyBoardPackageId,
    boardId: config.boardId,
    oracleCapId: config.oracleCapId,
    dbPath: config.dbPath,
    pollIntervalMs: config.pollIntervalMs,
    graphQLPageSize: config.graphQLPageSize,
    healthPort: config.healthPort
  });

  const boardSnapshot = await getBoardRegistrySnapshot(suiReadClient, {
    boardId: config.boardId
  });
  store.replaceActiveIndexes({
    singles: boardSnapshot.singles,
    multis: boardSnapshot.multis,
    insurances: boardSnapshot.insurances
  });
  logInfo("board calibration completed", {
    boardId: boardSnapshot.board.objectId,
    schemaVersion: boardSnapshot.board.schemaVersion,
    singles: boardSnapshot.singles.length,
    multis: boardSnapshot.multis.length,
    insurances: boardSnapshot.insurances.length
  });

  let stopped = false;
  const shutdown = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    server.stop(true);
    store.close();
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });

  try {
    while (true) {
      const lifecycle = await syncLifecycle(store, config, graphQLConfig);
      const killmail = await syncKillmail(store, writer, config, graphQLConfig);
      store.clearLastError();

      const lifecycleTotal = Object.values(lifecycle.perStreamCounts).reduce((sum, count) => sum + count, 0);
      if (lifecycleTotal > 0 || killmail.killmailCount > 0 || killmail.actionCount > 0) {
        idleCycles = 0;
        logInfo("sync cycle", {
          lifecycleTotal,
          lifecycleStreams: lifecycle.perStreamCounts,
          killmailCount: killmail.killmailCount,
          actionCount: killmail.actionCount
        });
      }

      if (!lifecycle.didWork && !killmail.didWork) {
        idleCycles += 1;
        if (idleCycles === 1 || idleCycles % 12 === 0) {
          logInfo("idle heartbeat", {
            pollIntervalMs: config.pollIntervalMs,
            active: store.health(streamKeys).active
          });
        }
        await Bun.sleep(config.pollIntervalMs);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setLastError(message);
    console.error("[oracle] fatal error", { message });
    shutdown();
    throw error;
  }
}

await main();
