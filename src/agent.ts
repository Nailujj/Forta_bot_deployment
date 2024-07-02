import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import {
  DEPLOYER_ADDRESS,
  DEPLOYMENT_TO_ADDRESS,
  CREATE_AGENT_SIG,
  UPDATE_AGENT_SIG,
  DISABLE_AGENT_SIG,
} from "./constants";

const createFinding = (
  name: string,
  description: string,
  alertId: string,
  txEvent: TransactionEvent,
  data: string
): Finding => {
  return Finding.fromObject({
    name,
    description,
    alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      txHash: txEvent.hash,
      from: txEvent.from,
      to: txEvent.to?.toLowerCase() || "",
      data,
    },
  });
};

const provideHandleTransaction = (
  deployerAddress: string,
  deploymentToAddress: string,
  createAgentSig: string,
  updateAgentSig: string,
  disableAgentSig: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (
      txEvent.from.toLowerCase() === deployerAddress.toLowerCase() &&
      txEvent.to &&
      txEvent.to.toLowerCase() === deploymentToAddress.toLowerCase()
    ) {
      const input = txEvent.transaction.data;

      if (input.startsWith(createAgentSig)) {
        findings.push(
          createFinding(
            "Create Agent Detected",
            `Create Agent function called by ${deployerAddress}`,
            "FORTA-CREATE",
            txEvent,
            input
          )
        );
      }

      if (input.startsWith(updateAgentSig)) {
        findings.push(
          createFinding(
            "Update Agent Detected",
            `Update Agent function called by ${deployerAddress}`,
            "FORTA-UPDATE",
            txEvent,
            input
          )
        );
      }

      if (input.startsWith(disableAgentSig)) {
        findings.push(
          createFinding(
            "Disable Agent Detected",
            `Disable Agent function called by ${deployerAddress}`,
            "FORTA-DISABLE",
            txEvent,
            input
          )
        );
      }
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    DEPLOYER_ADDRESS,
    DEPLOYMENT_TO_ADDRESS,
    CREATE_AGENT_SIG,
    UPDATE_AGENT_SIG,
    DISABLE_AGENT_SIG
  ),
};
