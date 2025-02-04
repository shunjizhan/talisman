import type { ChainId } from "@core/domains/chains/types"

import { useChains } from "./useChains"

export const useChain = (id?: ChainId) => {
  const { chainsMap } = useChains(true)

  return id ? chainsMap[id] : undefined
}

export default useChain
