import { AnalyticsPage } from "@ui/api/analytics"
import { EvmNetworkForm, SubNetworkForm } from "@ui/domains/Settings/ManageNetworks/NetworkForm"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { DashboardLayout } from "../../layout/DashboardLayout"
import { useNetworksType } from "./useNetworksType"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Settings",
  featureVersion: 1,
  page: "Settings - Network",
}

export const NetworkPage = () => {
  const { t } = useTranslation("admin")
  const navigate = useNavigate()
  const { id } = useParams<"id">()

  const [networksType] = useNetworksType()

  useAnalyticsPageView(ANALYTICS_PAGE, {
    id,
    mode: id ? t("Edit") : t("Add"),
    networkType: networksType,
  })

  const isChain = networksType === "polkadot"
  const isEvmNetwork = networksType === "ethereum"

  const handleSubmitted = useCallback(
    () => navigate(`/networks/${networksType}`),
    [navigate, networksType]
  )

  return (
    <DashboardLayout analytics={ANALYTICS_PAGE} withBack centered>
      {isChain && <SubNetworkForm chainId={id} onSubmitted={handleSubmitted} />}
      {isEvmNetwork && <EvmNetworkForm evmNetworkId={id} onSubmitted={handleSubmitted} />}
    </DashboardLayout>
  )
}
