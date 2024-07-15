import { Finding, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { ethers } from "ethers";

export const createFinding = (
  callSignature: string,
  txEvent: TransactionEvent,
  args: ethers.utils.Result
): Finding | null => {
  let name, description, alertId, metadata;

  if (callSignature.includes("create")) {
    name = "CREATE Agent Detected";
    description = "CREATE function called by Nethermind's deployer address";
    alertId = "NETHERMIND-1";
    metadata = {
      agentId: args[0].toString(),
      owner: args[1],
      metadata: args[2],
      chainIds: args[3].join(", "),
    };
  } else if (callSignature.includes("update")) {
    name = "UPDATE Agent Detected";
    description = "UPDATE function called by Nethermind's deployer address";
    alertId = "NETHERMIND-2";
    metadata = {
      agentId: args[0].toString(),
      metadata: args[1],
      chainIds: args[2].join(", "),
    };
  } else {
    name = "DISABLE Agent Detected";
    description = "DISABLE function called by Nethermind's deployer address";
    alertId = "NETHERMIND-3";
    metadata = {
      agentId: args[0].toString(),
      reason: args[1].toString(),
    };
  }

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
      ...metadata,
    },
  });
};
