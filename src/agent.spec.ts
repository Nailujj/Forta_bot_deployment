import { Finding, ethers, FindingSeverity, FindingType } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress, createTransactionHash } from "forta-agent-tools/lib/utils";
import agent from "./agent";

const { handleTransaction } = agent;

import {
  NETHERMIND_DEPLOYER_ADDRESS,
  AGENT_REGISTRY_ADDRESS,
  CREATE_AGENT_ABI,
  UPDATE_AGENT_ABI,
  DISABLE_AGENT_ABI,
} from "./constants";

export const iface = new ethers.utils.Interface([
  CREATE_AGENT_ABI,
  UPDATE_AGENT_ABI,
  DISABLE_AGENT_ABI
]);

const mockAgentId = 1;
const mockChainIds = [1, 2];
const mockMetadata = "metadata";
const testAddress1 = createAddress("0x0000000000000000000000000000000000000001");
const testAddress2 = createAddress("0x0000000000000000000000000000000000000002");
const testAddress3 = createAddress("0x0000000000000000000000000000000000000003");
const testAddress4 = createAddress("0x0000000000000000000000000000000000000004");
const testAddress5 = createAddress("0x0000000000000000000000000000000000000005");
const testAddress6 = createAddress("0x0000000000000000000000000000000000000006");

describe("handleTransaction", () => {
  it("should not detect unrelated transactions", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(testAddress1)
      .setTo(testAddress2)
      .setData("0x12345678")
      .setHash(createTransactionHash({ to: testAddress2 }));

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });

  it("should not detect related transaction from another deployer", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(testAddress3)
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .setData(iface.encodeFunctionData("createAgent", [mockAgentId, testAddress4, mockMetadata, mockChainIds]))
      .setHash(createTransactionHash({ to: createAddress(AGENT_REGISTRY_ADDRESS) }));

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });

  it("should not detect related transaction from Nethermind to another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(testAddress5)
      .setData(iface.encodeFunctionData("createAgent", [mockAgentId, testAddress4, mockMetadata, mockChainIds]))
      .setHash(createTransactionHash({ to: testAddress5 }));

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([]);
  });

  it("should not detect transaction of a bot deployment with the wrong function abi", async () => {
    const newProxyInterface = new ethers.utils.Interface([
      "function fooAgent(uint256 agentId,address owner,string metadata,uint256[] chainIds)",
    ]);
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: newProxyInterface.getFunction("fooAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress6, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect Create Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .setData(iface.encodeFunctionData("createAgent", [mockAgentId, testAddress4, mockMetadata, mockChainIds]))
      .setHash(createTransactionHash({ to: createAddress(AGENT_REGISTRY_ADDRESS) }));

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "CREATE Agent Detected",
        description: `CREATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          owner: testAddress4,
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });

  it("should detect Update Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .setData(iface.encodeFunctionData("updateAgent", [mockAgentId, mockMetadata, mockChainIds]))
      .setHash(createTransactionHash({ to: createAddress(AGENT_REGISTRY_ADDRESS) }));

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });

  it("should detect Disable Agent function call", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .setData(iface.encodeFunctionData("disableAgent", [mockAgentId, 1]))
      .setHash(createTransactionHash({ to: createAddress(AGENT_REGISTRY_ADDRESS) }));

    const findings = await handleTransaction(txEvent);
    expect(findings).toEqual([
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          reason: "1",
        },
      }),
    ]);
  });

  it("should detect Create Agent function call in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress6, mockMetadata, mockChainIds],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          owner: testAddress6,
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });

  it("should detect Update Agent function call in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, mockMetadata, mockChainIds],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });

  it("should detect Disable Agent function call in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, 1],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          reason: "1",
        },
      }),
    ]);
  });

  it("should detect multiple Create Agent function calls in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress4, mockMetadata, mockChainIds],
      })
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress5, mockMetadata, mockChainIds],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          owner: testAddress4,
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
      Finding.fromObject({
        name: "CREATE Agent Detected",
        description: `CREATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          owner: testAddress5,
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });

  it("should detect multiple Update Agent function calls in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      })
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, mockMetadata, mockChainIds],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });

  it("should detect multiple Disable Agent function calls in traces", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, 1],
      })
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, 1],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          reason: "1",
        },
      }),
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          reason: "1",
        },
      }),
    ]);
  });

  it("should detect multiple different function calls", async () => {
    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress4, mockMetadata, mockChainIds],
      })
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      })
      .addTraces({
        function: iface.getFunction("disableAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, 1],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          owner: testAddress4,
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
      Finding.fromObject({
        name: "DISABLE Agent Detected",
        description: `DISABLE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-3",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          reason: "1",
        },
      }),
    ]);
  });

  it("should detect multiple function calls of different types mixed with non-valid function calls", async () => {
    const newProxyInterface = new ethers.utils.Interface([
      "function fooAgent(uint256 agentId,address owner,string metadata,uint256[] chainIds)",
    ]);

    const txEvent = new TestTransactionEvent()
      .setFrom(createAddress(NETHERMIND_DEPLOYER_ADDRESS))
      .setTo(createAddress(AGENT_REGISTRY_ADDRESS))
      .addTraces({
        function: iface.getFunction("createAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress4, mockMetadata, mockChainIds],
      })
      .addTraces({
        function: iface.getFunction("updateAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      })
      .addTraces({
        function: newProxyInterface.getFunction("fooAgent"),
        to: createAddress(AGENT_REGISTRY_ADDRESS),
        from: createAddress(NETHERMIND_DEPLOYER_ADDRESS),
        arguments: [mockAgentId, testAddress6, mockMetadata, mockChainIds],
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
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          owner: testAddress4,
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
      Finding.fromObject({
        name: "UPDATE Agent Detected",
        description: `UPDATE function called by Nethermind's deployer address`,
        alertId: "NETHERMIND-2",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          txHash: txEvent.hash,
          from: createAddress(NETHERMIND_DEPLOYER_ADDRESS).toLowerCase(),
          to: createAddress(AGENT_REGISTRY_ADDRESS).toLowerCase(),
          agentId: mockAgentId.toString(),
          metadata: mockMetadata,
          chainIds: mockChainIds.join(", "),
        },
      }),
    ]);
  });
});
