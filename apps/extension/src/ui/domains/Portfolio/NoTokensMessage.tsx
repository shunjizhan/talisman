import { ArrowDownIcon, CreditCardIcon } from "@talismn/icons"
import { useSelectedAccount } from "@ui/domains/Portfolio/SelectedAccountContext"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useIsFeatureEnabled } from "@ui/hooks/useFeatures"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { PillButton } from "talisman-ui"

import { useBuyTokensModal } from "../Asset/Buy/BuyTokensModalContext"
import { useCopyAddressModal } from "../CopyAddress"

type NoTokensMessageProps = {
  symbol: string
}

export const NoTokensMessage = ({ symbol }: NoTokensMessageProps) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()
  const { account } = useSelectedAccount()
  const { open } = useCopyAddressModal()

  const handleCopy = useCallback(() => {
    open({ mode: "receive", address: account?.address })
    genericEvent("open receive", { from: "NoTokensMessage" })
  }, [account?.address, genericEvent, open])

  const showBuyCrypto = useIsFeatureEnabled("BUY_CRYPTO")
  const { open: openBuyCrypto } = useBuyTokensModal()
  const handleBuyCryptoClick = useCallback(() => {
    openBuyCrypto()
  }, [openBuyCrypto])

  return (
    <div className="bg-field text-body-secondary flex flex-col items-center justify-center rounded py-36">
      <div>
        {account
          ? t("You don't have any {{symbol}} in this account", { symbol })
          : t("You don't have any {{symbol}} in Talisman", { symbol })}
      </div>
      <div className="mt-12 flex justify-center gap-4">
        <PillButton size="sm" icon={ArrowDownIcon} onClick={handleCopy}>
          {t("Receive")}
        </PillButton>
        {showBuyCrypto && (
          <PillButton size="sm" icon={CreditCardIcon} onClick={handleBuyCryptoClick}>
            {t("Buy Crypto")}
          </PillButton>
        )}
      </div>
    </div>
  )
}
