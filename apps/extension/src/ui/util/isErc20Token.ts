import { Erc20Token, Token } from "@core/domains/tokens/types"

export const isErc20Token = <T extends Token>(
  token?: T | null | Erc20Token
): token is Erc20Token => {
  return token?.type === "evm-erc20"
}
