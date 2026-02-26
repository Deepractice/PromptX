/**
 * useAgentX - React hook for AgentX remote connection
 *
 * Creates and manages an AgentX instance that connects to a remote server.
 * This hook only supports remote mode (browser environment).
 *
 * @example
 * ```tsx
 * import { useAgentX } from "@agentxjs/ui";
 *
 * function App() {
 *   const agentx = useAgentX("ws://localhost:5200");
 *
 *   if (!agentx) return <div>Connecting...</div>;
 *
 *   return <Chat agentx={agentx} />;
 * }
 * ```
 */

import { useState, useEffect } from "react";
import type { AgentX } from "agentxjs";
import { createAgentX } from "agentxjs";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("ui/useAgentX");

/**
 * React hook for AgentX remote connection
 *
 * Creates an AgentX instance on mount and disposes on unmount.
 * Only supports remote mode (connects to WebSocket server).
 *
 * @param serverUrl - WebSocket server URL (e.g., "ws://localhost:5200")
 * @returns The AgentX instance (null during connection)
 */
export function useAgentX(serverUrl: string): AgentX | null {
  const [agentx, setAgentx] = useState<AgentX | null>(null);

  useEffect(() => {
    let instance: AgentX | null = null;
    let mounted = true;

    createAgentX({ serverUrl })
      .then((agentx) => {
        if (!mounted) {
          agentx.dispose();
          return;
        }
        instance = agentx;
        setAgentx(agentx);
        logger.info("Connected to server", { serverUrl });
      })
      .catch((error) => {
        logger.error("Failed to connect to server", { serverUrl, error });
      });

    return () => {
      mounted = false;
      if (instance) {
        instance.dispose().catch((error) => {
          logger.error("Failed to dispose AgentX", { error });
        });
      }
    };
  }, [serverUrl]);

  return agentx;
}
