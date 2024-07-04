import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding } from "./findings";
import {
  NETHERMIND_DEPLOYER_ADDRESS as DEPLOYER_ADDRESS,
  AGENT_REGISTRY_ADDRESS,
  CREATE_AGENT_ABI,
  UPDATE_AGENT_ABI,
  DISABLE_AGENT_ABI,
} from "./constants";

const provideHandleTransaction = (
  deployerAddress: string,
  agentRegistryAddress: string,
  createAgentAbi: string,
  updateAgentAbi: string,
  disableAgentAbi: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from !== deployerAddress.toLowerCase()) return findings;

    // filter by relevant events
    const agentDeploymentEvents = txEvent.filterFunction(
      [createAgentAbi, updateAgentAbi, disableAgentAbi],
      agentRegistryAddress
    );

    // if no bot deployment events are found
    if (!agentDeploymentEvents.length) return findings;

    agentDeploymentEvents.forEach((event) => {
      if (event.signature.includes("create")) {
        findings.push(
          createFinding(
            "CREATE Agent Detected",
            "CREATE function called by Nethermind's deployer address",
            "NETHERMIND-1",
            txEvent,
            txEvent.transaction.data
          )
        );
      } else if (event.signature.includes("update")) {
        findings.push(
          createFinding(
            "UPDATE Agent Detected",
            "UPDATE function called by Nethermind's deployer address",
            "NETHERMIND-2",
            txEvent,
            txEvent.transaction.data
          )
        );
      } else if (event.signature.includes("disable")) {
        findings.push(
          createFinding(
            "DISABLE Agent Detected",
            "DISABLE function called by Nethermind's deployer address",
            "NETHERMIND-3",
            txEvent,
            txEvent.transaction.data
          )
        );
      }
    });
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    DEPLOYER_ADDRESS,
    AGENT_REGISTRY_ADDRESS,
    CREATE_AGENT_ABI,
    UPDATE_AGENT_ABI,
    DISABLE_AGENT_ABI
  ),
};
