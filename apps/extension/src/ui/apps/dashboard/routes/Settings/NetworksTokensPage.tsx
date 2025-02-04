import { HeaderBlock } from "@talisman/components/HeaderBlock"
import { Spacer } from "@talisman/components/Spacer"
import { ChevronRightIcon, GlobeIcon, ListIcon, PolkadotVaultIcon } from "@talismn/icons"
import { useTranslation } from "react-i18next"
import { CtaButton } from "talisman-ui"

import { DashboardLayout } from "../../layout/DashboardLayout"

export const NetworksTokensPage = () => {
  const { t } = useTranslation("admin")

  return (
    <DashboardLayout centered>
      <HeaderBlock
        title={t("Networks & Tokens")}
        text={t("View, edit and add custom networks and tokens")}
      />
      <Spacer large />
      <div className="flex flex-col gap-4">
        <CtaButton
          iconLeft={GlobeIcon}
          iconRight={ChevronRightIcon}
          title={t("Manage Networks")}
          subtitle={t("View, edit and delete custom networks")}
          to={`/networks/ethereum`}
        />
        <CtaButton
          iconLeft={ListIcon}
          iconRight={ChevronRightIcon}
          title={t("Manage Ethereum Tokens")}
          subtitle={t("Add or delete custom ERC20 tokens")}
          to={`/tokens`}
        />
        <CtaButton
          iconLeft={PolkadotVaultIcon}
          iconRight={ChevronRightIcon}
          title={t("Polkadot Vault Metadata")}
          subtitle={t("Register networks on your Polkadot Vault device, or update their metadata")}
          to={`/settings/qr-metadata`}
        />
      </div>
    </DashboardLayout>
  )
}
