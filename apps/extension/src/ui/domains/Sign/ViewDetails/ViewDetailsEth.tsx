import { BalanceFormatter } from "@core/domains/balances"
import { notify } from "@talisman/components/Notifications"
import { useOpenClose } from "@talisman/hooks/useOpenClose"
import { CopyIcon } from "@talismn/icons"
import { formatDecimals } from "@talismn/util"
import Fiat from "@ui/domains/Asset/Fiat"
import Tokens from "@ui/domains/Asset/Tokens"
import { useFeePriorityOptionsUI } from "@ui/domains/Ethereum/GasSettings/common"
import { NetworkUsage } from "@ui/domains/Ethereum/NetworkUsage"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import useToken from "@ui/hooks/useToken"
import { useTokenRates } from "@ui/hooks/useTokenRates"
import { BigNumber, BigNumberish } from "ethers"
import { formatEther, formatUnits } from "ethers/lib/utils"
import { FC, PropsWithChildren, ReactNode, useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer, PillButton } from "talisman-ui"

import { Message } from "../Message"
import { useEthSignTransactionRequest } from "../SignRequestContext"
import { ViewDetailsAddress } from "./ViewDetailsAddress"
import { ViewDetailsField } from "./ViewDetailsField"

const ViewDetailsGrid: FC<PropsWithChildren> = ({ children }) => (
  <div className="grid-cols-keyvalue grid gap-x-8 whitespace-nowrap">{children}</div>
)

const ViewDetailsGridRow: FC<{ left: ReactNode; right: ReactNode }> = ({ left, right }) => (
  <>
    <div className="text-body-secondary">{left}</div>
    <div className="text-right">{right}</div>
  </>
)

type ViewDetailsContentProps = {
  onClose: () => void
}

const Gwei: FC<{ value: BigNumberish | null | undefined }> = ({ value }) => {
  const { t } = useTranslation("request")
  return (
    <>
      {value
        ? t("{{value}} GWEI", { value: formatDecimals(formatUnits(value, "gwei")) })
        : t("N/A")}
    </>
  )
}

const ViewDetailsContent: FC<ViewDetailsContentProps> = ({ onClose }) => {
  const { t } = useTranslation("request")
  const feePriorityOptions = useFeePriorityOptionsUI()
  const {
    request,
    network,
    networkUsage,
    txDetails,
    priority,
    transaction,
    transactionInfo,
    error,
    errorDetails,
  } = useEthSignTransactionRequest()
  const { genericEvent } = useAnalytics()

  const txInfo = useMemo(() => {
    if (transactionInfo && transactionInfo.contractType !== "unknown") return transactionInfo
    return undefined
  }, [transactionInfo])

  const nativeToken = useToken(network?.nativeToken?.id)
  const formatEthValue = useCallback(
    (value?: BigNumberish) => {
      return value ? `${formatEther(value)} ${nativeToken?.symbol ?? ""}` : null
    },
    [nativeToken?.symbol]
  )

  const nativeTokenRates = useTokenRates(nativeToken?.id)

  useEffect(() => {
    genericEvent("open sign transaction view details", { type: "ethereum" })
  }, [genericEvent])

  const [estimatedFee, maximumFee] = useMemo(
    () =>
      txDetails && nativeToken
        ? [
            new BalanceFormatter(
              BigNumber.from(txDetails?.estimatedFee).toString(),
              nativeToken?.decimals,
              nativeTokenRates
            ),
            new BalanceFormatter(
              BigNumber.from(txDetails?.maxFee).toString(),
              nativeToken?.decimals,
              nativeTokenRates
            ),
          ]
        : [null, null],
    [nativeToken, nativeTokenRates, txDetails]
  )

  const handleCopyByteCode = useCallback(async () => {
    if (!request?.data) return
    try {
      await navigator.clipboard.writeText(request.data.toString())
      notify(
        {
          type: "success",
          title: t("Byte code copied"),
        }
        // set an id to prevent multiple clicks to display multiple notifications
      )
    } catch (err) {
      notify({
        type: "error",
        title: t(`Copy failed`),
      })
    }
  }, [request?.data, t])

  if (!request) return null

  return (
    <div className="bg-grey-850 flex max-h-[60rem] w-full flex-col gap-12 p-12">
      <div className="scrollable scrollable-700 flex-grow overflow-y-auto pr-4 text-sm leading-[2rem]">
        <div className="text-body-secondary">{t("Details")}</div>
        {!!txInfo?.isContractCall && (
          <ViewDetailsField label={t("Contract type and method")}>
            {txInfo?.contractType
              ? `${txInfo?.contractType} : ${txInfo?.contractCall?.name ?? t("N/A")}`
              : t("Unknown")}
          </ViewDetailsField>
        )}
        <ViewDetailsAddress
          label={t("From")}
          address={request.from}
          blockExplorerUrl={network?.explorerUrl}
        />
        <ViewDetailsAddress
          label={t("To")}
          address={request.to}
          blockExplorerUrl={network?.explorerUrl}
        />
        <ViewDetailsField label={t("Value to be transferred")} breakAll>
          {formatEthValue(request.value)}
        </ViewDetailsField>
        <ViewDetailsField label={t("Network")}>
          <ViewDetailsGrid>
            <ViewDetailsGridRow
              left={t("Name")}
              right={network ? `${network.name} (${network.id})` : null}
            />
            <ViewDetailsGridRow
              left={t("Usage")}
              right={
                typeof networkUsage === "number" ? `${Math.round(networkUsage * 100)}%` : t("N/A")
              }
            />
            {transaction?.type === 2 && (
              <>
                <ViewDetailsGridRow
                  left={t("Base fee per gas")}
                  right={<Gwei value={txDetails?.baseFeePerGas} />}
                />
                <ViewDetailsGridRow
                  left={t("Base fee trend")}
                  right={
                    <NetworkUsage
                      baseFeeTrend={txDetails?.baseFeeTrend}
                      className="h-10 justify-end"
                    />
                  }
                />
              </>
            )}
          </ViewDetailsGrid>
        </ViewDetailsField>
        {!!priority && (
          <ViewDetailsField label={`${t("Gas settings")} (${feePriorityOptions[priority].label})`}>
            {transaction ? (
              <ViewDetailsGrid>
                {transaction?.type === 2 ? (
                  <>
                    <ViewDetailsGridRow left={t("Type")} right="EIP-1559" />

                    <ViewDetailsGridRow
                      left={t("Max priority fee per gas")}
                      right={<Gwei value={transaction.maxPriorityFeePerGas} />}
                    />
                    <ViewDetailsGridRow
                      left={t("Max fee per gas")}
                      right={<Gwei value={transaction.maxFeePerGas} />}
                    />
                  </>
                ) : (
                  <>
                    <ViewDetailsGridRow left={t("Type")} right={t("Legacy")} />
                    <ViewDetailsGridRow
                      left={t("Gas price")}
                      right={<Gwei value={transaction?.gasPrice} />}
                    />
                  </>
                )}
                <ViewDetailsGridRow
                  left={t("Gas limit")}
                  right={
                    transaction?.gasLimit
                      ? BigNumber.from(transaction.gasLimit)?.toNumber()
                      : t("N/A")
                  }
                />
              </ViewDetailsGrid>
            ) : (
              t("N/A")
            )}
          </ViewDetailsField>
        )}
        <ViewDetailsField label={t("Total Fee")}>
          {transaction ? (
            <ViewDetailsGrid>
              <ViewDetailsGridRow
                left={t("Estimated")}
                right={
                  <>
                    {estimatedFee?.tokens ? (
                      <Tokens
                        amount={estimatedFee?.tokens}
                        decimals={nativeToken?.decimals}
                        symbol={nativeToken?.symbol}
                      />
                    ) : (
                      t("N/A")
                    )}
                    {estimatedFee && nativeTokenRates ? (
                      <>
                        {" "}
                        / <Fiat amount={estimatedFee} noCountUp />
                      </>
                    ) : null}
                  </>
                }
              />
              <ViewDetailsGridRow
                left={t("Maximum")}
                right={
                  <>
                    {maximumFee?.tokens ? (
                      <Tokens
                        amount={maximumFee?.tokens}
                        decimals={nativeToken?.decimals}
                        symbol={nativeToken?.symbol}
                      />
                    ) : (
                      t("N/A")
                    )}
                    {maximumFee && nativeTokenRates ? (
                      <>
                        {" "}
                        / <Fiat amount={maximumFee} noCountUp />
                      </>
                    ) : null}
                  </>
                }
              />
            </ViewDetailsGrid>
          ) : (
            t("N/A")
          )}
        </ViewDetailsField>
        <ViewDetailsField
          label={t("Error")}
          error={`${error ?? ""}${errorDetails ? `\n${errorDetails}` : ""}`}
        />
        {request.data && (
          <ViewDetailsField
            label={
              <button
                type="button"
                onClick={handleCopyByteCode}
                className="text-body-secondary text-left hover:text-white"
              >
                <CopyIcon className="inline transition-none" /> {t("Copy byte code")}
              </button>
            }
          >
            <Message
              rows={6}
              className="bg-grey-800 w-full rounded-sm"
              text={request.data?.toString()}
            />
          </ViewDetailsField>
        )}
      </div>
      <Button className="shrink-0" onClick={onClose}>
        {t("Close")}
      </Button>
    </div>
  )
}

export const ViewDetailsEth = () => {
  const { t } = useTranslation("request")
  const { isOpen, open, close } = useOpenClose()
  const { isLoading } = useEthSignTransactionRequest()

  return (
    <>
      <PillButton size="sm" onClick={open}>
        {t("View Details")}
      </PillButton>
      <Drawer anchor="bottom" containerId="main" isOpen={isOpen && !isLoading} onDismiss={close}>
        <ViewDetailsContent onClose={close} />
      </Drawer>
    </>
  )
}
