import { CustomErc20Token, Token } from "@core/domains/tokens/types"

export const isCustomErc20Token = <T extends Token>(
  token?: T | null | CustomErc20Token
): token is CustomErc20Token => {
  return token?.type === "evm-erc20" && (token as CustomErc20Token).isCustom
}
