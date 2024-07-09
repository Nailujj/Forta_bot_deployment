export const NETHERMIND_DEPLOYER_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
export const AGENT_REGISTRY_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

export const CREATE_AGENT_ABI ="function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds) external";
export const UPDATE_AGENT_ABI = "function updateAgent(uint256 agentId,string metadata,uint256[] chainIds) public";
export const DISABLE_AGENT_ABI = "function disableAgent(uint256 agentId,uint8 permission)";
