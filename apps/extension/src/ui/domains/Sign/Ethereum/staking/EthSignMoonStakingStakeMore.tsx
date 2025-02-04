import { BigNumber } from "ethers"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { SignContainer } from "../../SignContainer"
import { SignViewIconHeader } from "../../Views/SignViewIconHeader"
import { SignViewStakingStakeMore } from "../../Views/staking/SignViewStakingStakeMore"
import { getContractCallArg } from "../getContractCallArg"
import { useEthSignKnownTransactionRequest } from "../shared/useEthSignKnownTransactionRequest"

export const EthSignMoonStakingStakeMore: FC = () => {
  const { t } = useTranslation("request")
  const { network, transactionInfo } = useEthSignKnownTransactionRequest()

  const more = useMemo(
    () => getContractCallArg<BigNumber>(transactionInfo.contractCall, "more")?.toBigInt(),
    [transactionInfo.contractCall]
  )

  if (!network?.nativeToken?.id || !more) return null

  return (
    <SignContainer
      networkType="ethereum"
      title={t("Increase stake")}
      header={<SignViewIconHeader icon="stake" />}
    >
      <SignViewStakingStakeMore planck={more} tokenId={network.nativeToken.id} />
    </SignContainer>
  )
}
