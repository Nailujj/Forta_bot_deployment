import { Finding, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (
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
