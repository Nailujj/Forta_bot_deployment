import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { ethers } from "ethers";
import { createFinding } from "./findings";
import {
  NETHERMIND_DEPLOYER_ADDRESS,
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
  const iface = new ethers.utils.Interface([
    createAgentAbi,
    updateAgentAbi,
    disableAgentAbi
  ]);

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from !== deployerAddress.toLowerCase()) return findings;

    // filter by relevant events
    const agentDeploymentCalls = txEvent.filterFunction(
      [createAgentAbi, updateAgentAbi, disableAgentAbi],
      agentRegistryAddress
    );

    agentDeploymentCalls.forEach((call) => {
      const finding = createFinding(call.signature, txEvent, call.args);
      if (finding) {
        findings.push(finding);
      }
    });
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    NETHERMIND_DEPLOYER_ADDRESS,
    AGENT_REGISTRY_ADDRESS,
    CREATE_AGENT_ABI,
    UPDATE_AGENT_ABI,
    DISABLE_AGENT_ABI
  ),
};
