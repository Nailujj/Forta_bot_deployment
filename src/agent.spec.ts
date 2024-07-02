import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import agent from "./agent";

const { handleTransaction } = agent;

import {
  DEPLOYER_ADDRESS,
  DEPLOYMENT_TO_ADDRESS,
  CREATE_AGENT_SIG,
  UPDATE_AGENT_SIG,
  DISABLE_AGENT_SIG,
} from "./constants";

describe("handleTransaction", () => {
  it("should detect Create Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setTo(DEPLOYMENT_TO_ADDRESS)
      .setData(CREATE_AGENT_SIG) // Simplified mock data
      .setHash("0xmocktxhash1")
      .setFrom(DEPLOYER_ADDRESS);

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "Create Agent Detected",
        description: `Create Agent function called by ${DEPLOYER_ADDRESS}`,
        alertId: "FORTA-CREATE",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: "0xmocktxhash1",
          from: DEPLOYER_ADDRESS.toLowerCase(),
          to: DEPLOYMENT_TO_ADDRESS.toLowerCase(),
          data: CREATE_AGENT_SIG,
        },
      }),
    ]);
  });

  it("should detect Update Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setTo(DEPLOYMENT_TO_ADDRESS)
      .setData(UPDATE_AGENT_SIG) // Simplified mock data
      .setHash("0xmocktxhash2")
      .setFrom(DEPLOYER_ADDRESS);

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "Update Agent Detected",
        description: `Update Agent function called by ${DEPLOYER_ADDRESS}`,
        alertId: "FORTA-UPDATE",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: "0xmocktxhash2",
          from: DEPLOYER_ADDRESS.toLowerCase(),
          to: DEPLOYMENT_TO_ADDRESS.toLowerCase(),
          data: UPDATE_AGENT_SIG,
        },
      }),
    ]);
  });

  it("should detect Disable Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setTo(DEPLOYMENT_TO_ADDRESS)
      .setData(DISABLE_AGENT_SIG) // Simplified mock data
      .setHash("0xmocktxhash3")
      .setFrom(DEPLOYER_ADDRESS);

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "Disable Agent Detected",
        description: `Disable Agent function called by ${DEPLOYER_ADDRESS}`,
        alertId: "FORTA-DISABLE",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: "0xmocktxhash3",
          from: DEPLOYER_ADDRESS.toLowerCase(),
          to: DEPLOYMENT_TO_ADDRESS.toLowerCase(),
          data: DISABLE_AGENT_SIG,
        },
      }),
    ]);
  });

  it("should not detect unrelated transactions", async () => {
    const txEvent = new TestTransactionEvent()
      .setTo("0xotheraddress")
      .setData("0x12345678")
      .setHash("0xmocktxhash4")
      .setFrom("0xmockfromaddress4");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });
});
