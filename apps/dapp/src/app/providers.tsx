import { EveFrontierProvider } from "@evefrontier/dapp-kit";
import { RouterProvider, type DataRouter } from "react-router-dom";
import { queryClient } from "../lib/query-client";

type AppProvidersProps = {
  router: DataRouter;
};

const EVE_CONNECTION_STORAGE_KEY = "eve-dapp-connected";

if (typeof window !== "undefined") {
  window.localStorage.removeItem(EVE_CONNECTION_STORAGE_KEY);
}

export function AppProviders({ router }: AppProvidersProps) {
  return (
    <EveFrontierProvider queryClient={queryClient}>
      <RouterProvider router={router} />
    </EveFrontierProvider>
  );
}
