import * as React from "react";
import { Server, Api } from "@stellar/stellar-sdk/rpc";
import { rpcUrl, stellarNetwork } from "../contracts/util";

/**
 * Concatenated `${contractId}:${topic}`
 */
type PagingKey = string;

/**
 * Paging tokens for each contract/topic pair.
 */
const paging: Record<
  PagingKey,
  { lastLedgerStart?: number; pagingToken?: string }
> = {};

// Server configured using environment variables
const server = new Server(rpcUrl, { allowHttp: stellarNetwork === "LOCAL" });

/**
 * Subscribe to contract events for a given topic.
 *
 * This function continuously polls Soroban RPC for contract events
 * and triggers the `onEvent` callback whenever a new one arrives.
 */
export function useSubscription(
  contractId: string,
  topic: string,
  onEvent: (event: Api.EventResponse) => void,
  pollInterval = 5000
) {
  const id = `${contractId}:${topic}`;
  paging[id] = paging[id] || {};

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let stop = false;

    async function pollEvents(): Promise<void> {
      try {
        // Initialize from latest ledger if this is the first run
        if (!paging[id].lastLedgerStart) {
          const latestLedgerState = await server.getLatestLedger();
          paging[id].lastLedgerStart = latestLedgerState.sequence;
        }

        // Query events from Soroban RPC
        const pagingToken = paging[id].pagingToken;
        const response = await server.getEvents({
          cursor: pagingToken ?? "",
          filters: [
            {
              contractIds: [contractId],
              topics: [[topic]],
              type: "contract",
            },
          ],
          limit: 10,
        });

        paging[id].pagingToken = undefined;

        // Update last known ledger
        if (response.latestLedger) {
          paging[id].lastLedgerStart = response.latestLedger;
        }

        // Handle each event found
        if (response.events) {
          response.events.forEach((event) => {
            try {
              onEvent(event);
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.error(
                  "Poll Events: subscription callback had error:",
                  error.message
                );
              } else {
                console.error("Poll Events: unknown error:", error);
              }
            } finally {
              // @ts-expect-error SDK type mismatch (temporary until SDK updates)
              paging[id].pagingToken = event.pagingToken as string;
            }
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Poll Events: error:", error.message);
        } else {
          console.error("Poll Events: unknown error:", error);
        }
      } finally {
        if (!stop) {
          timeoutId = setTimeout(() => void pollEvents(), pollInterval);
        }
      }
    }

    void pollEvents();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      stop = true;
    };
  }, [contractId, topic, onEvent, id, pollInterval]);
}
