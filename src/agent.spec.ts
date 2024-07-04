import { Finding, ethers, FindingSeverity, FindingType } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import agent from "./agent";
import { NETHERMIND_DEPLOYER_ADDRESS, iface } from "./constants";

const { handleTransaction } = agent;

import {
  NETHERMIND_DEPLOYER_ADDRESS as DEPLOYER_ADDRESS,
  AGENT_REGISTRY_ADDRESS,
  CREATE_AGENT_ABI,
  UPDATE_AGENT_ABI,
  DISABLE_AGENT_ABI,
} from "./constants";

describe("handleTransaction", () => {
  it("should not detect unrelated transactions", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom("0xunrelatedaddress")
      .setTo("0xotheraddress")
      .setData("0x12345678")
      .setHash("0xmocktxhash0");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });

  it("should not detect related transaction from another deployer", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom("0xnotnethermind")
      .setTo(AGENT_REGISTRY_ADDRESS)
      .setData(iface.encodeFunctionData("createAgent", [1, createAddress("0x1"), "metadata", [1, 2]]))
      .setHash("0xmocktxhash1");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });

  it("should not detect related transaction from Nethermind but to another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(NETHERMIND_DEPLOYER_ADDRESS)
      .setTo("0xnotagentregistry")
      .setData(iface.encodeFunctionData("createAgent", [1, createAddress("0x1"), "metadata", [1, 2]]))
      .setHash("0xmocktxhash1");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });

  it("should not detect transaction of a bot deployment with the wrong function abi", async () => {
    const newProxyInterface = new ethers.utils.Interface([
      "function fooAgent(uint256 agentId,address owner,string metadata,uint256[] chainIds)",
    ]);
    const txEvent = new TestTransactionEvent()
      .setFrom(NETHERMIND_DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: newProxyInterface.getFunction("fooAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, createAddress("0x1"), "metadata", [1, 2]],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect Create Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .setData(iface.encodeFunctionData("createAgent", [1, createAddress("0x1"), "metadata", [1, 2]]))
      .setHash("0xmocktxhash1");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "CREATE Agent Detected",
        description: `CREATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: "0xmocktxhash1",
          from: DEPLOYER_ADDRESS.toLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLowerCase(),
          data: iface.encodeFunctionData("createAgent", [1, createAddress("0x1"), "metadata", [1, 2]]),
        },
      }),
    ]);
  });

  it("should detect Update Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .setData(iface.encodeFunctionData("updateAgent", [1, "metadata", [1, 2]]))
      .setHash("0xmocktxhash2");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: "0xmocktxhash2",
          from: DEPLOYER_ADDRESS.toLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLowerCase(),
          data: iface.encodeFunctionData("updateAgent", [1, "metadata", [1, 2]]),
        },
      }),
    ]);
  });

  it("should detect Disable Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .setData(iface.encodeFunctionData("disableAgent", [1, 1]))
      .setHash("0xmocktxhash3");

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: "0xmocktxhash3",
          from: DEPLOYER_ADDRESS.toLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLowerCase(),
          data: iface.encodeFunctionData("disableAgent", [1, 1]),
        },
      }),
    ]);
  });

  it("should detect Create Agent function call in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, createAddress("0x1"), "metadata", [1, 2]],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "CREATE Agent Detected",
        description: `CREATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
    ]);
  });

  it("should detect Update Agent function call in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, "metadata", [1, 2]],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
    ]);
  });

  it("should detect Disable Agent function call in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, 1],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
    ]);
  });

  it("should detect multiple Create Agent function calls in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, createAddress("0x1"), "metadata", [1, 2]],
      })
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, createAddress("0x1"), "metadata", [1, 2]],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "CREATE Agent Detected",
        description: `CREATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
      Finding.fromObject({
        name: "CREATE Agent Detected",
        description: `CREATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
    ]);
  });

  it("should detect multiple Update Agent function calls in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, "metadata", [1, 2]],
      })
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, "metadata", [1, 2]],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
    ]);
  });

  it("should detect mutliple Disable Agent function calls in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(DEPLOYER_ADDRESS)
      .setTo(AGENT_REGISTRY_ADDRESS)
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, 1],
      })
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: AGENT_REGISTRY_ADDRESS,
        from: NETHERMIND_DEPLOYER_ADDRESS,
        arguments: [1, 1],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          data: "0x",
          from: NETHERMIND_DEPLOYER_ADDRESS.toLocaleLowerCase(),
          to: AGENT_REGISTRY_ADDRESS.toLocaleLowerCase(),
          txHash: "0x",
        },
      }),
    ]);
  });
});
