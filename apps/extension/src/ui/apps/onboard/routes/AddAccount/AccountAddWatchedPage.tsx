import { AccountAddWatchedForm } from "@ui/domains/Account/AccountAdd/AccountAddWatchedForm"
import { useTranslation } from "react-i18next"

import { AccountAddWrapper } from "./AccountAddWrapper"

export const AccountAddWatchedPage = () => {
  const { t } = useTranslation("admin")
  return (
    <AccountAddWrapper
      title={t("Choose account type")}
      subtitle={t("What type of account would you like to add?")}
      render={(onSuccess) => <AccountAddWatchedForm onSuccess={onSuccess} />}
    />
  )
}
