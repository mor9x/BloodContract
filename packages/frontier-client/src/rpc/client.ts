import { SuiClient } from "@mysten/sui/client";
import { utopiaEnvironment } from "../constants";

export type SuiReadClient = Pick<SuiClient, "getObject">;

export function createSuiReadClient(rpcUrl: string = utopiaEnvironment.suiRpcUrl): SuiReadClient {
  return new SuiClient({
    url: rpcUrl
  });
}
