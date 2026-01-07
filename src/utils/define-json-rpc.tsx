import { BASE_JSON_RPC_URL, BASE_SEPOLIA_JSON_RPC_URL } from "@/app/configs/rpc"

const defineJSONRpcUrl = (
  chainId: string | undefined
) => {
  if (!chainId) {
    return BASE_JSON_RPC_URL
  }
  switch (chainId) {
    case '8453':
      return BASE_JSON_RPC_URL
    case '84532':
      return BASE_SEPOLIA_JSON_RPC_URL
    default:
      return BASE_JSON_RPC_URL 
  }
}

export default defineJSONRpcUrl