import { Chain } from "@core/domains/chains/types"
import { tokensWithTestnetsMapState } from "@ui/atoms"
import { useMemo } from "react"
import { useRecoilValue } from "recoil"

const useChainsAndSearchSymbols = <T extends Chain>(
  chains: T[]
): Array<T & { searchSymbols: string[] }> => {
  const tokensWithTestnetsMap = useRecoilValue(tokensWithTestnetsMapState)

  return useMemo(
    () =>
      (chains || []).map((chain) => ({
        ...chain,
        searchSymbols: [
          // add native token symbol if it exists
          chain.nativeToken ? tokensWithTestnetsMap[chain.nativeToken.id]?.symbol : undefined,

          // add orml token symbols if they exist
          ...(chain.tokens ? chain.tokens.map(({ id }) => tokensWithTestnetsMap[id]?.symbol) : []),
        ].filter((symbol): symbol is string => typeof symbol === "string"),
      })),
    [chains, tokensWithTestnetsMap]
  )
}

export default useChainsAndSearchSymbols
