import { AccountJsonHardwareEthereum } from "@core/domains/accounts/types"
import { EthSignMessageMethod } from "@core/domains/signing/types"
import i18next from "@core/i18nConfig"
import { log } from "@core/log"
import { bufferToHex, isHexString, stripHexPrefix } from "@ethereumjs/util"
import LedgerEthereumApp from "@ledgerhq/hw-app-eth"
import { SignTypedDataVersion, TypedDataUtils } from "@metamask/eth-sig-util"
import { classNames } from "@talismn/util"
import { useLedgerEthereum } from "@ui/hooks/ledger/useLedgerEthereum"
import { ethers } from "ethers"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Drawer } from "talisman-ui"
import { Button } from "talisman-ui"

import {
  LedgerConnectionStatus,
  LedgerConnectionStatusProps,
} from "../Account/LedgerConnectionStatus"
import { LedgerSigningStatus } from "./LedgerSigningStatus"
import { SignHardwareEthereumProps } from "./SignHardwareEthereum"

const signWithLedger = async (
  ledger: LedgerEthereumApp,
  method: EthSignMessageMethod | "eth_sendTransaction",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  accountPath: string
): Promise<`0x${string}`> => {
  // TODO Uncomment wen this method actually works
  // if (["eth_signTypedData", "eth_signTypedData_v3", "eth_signTypedData_v4"].includes(method)) {
  //   const jsonMessage = typeof payload === "string" ? JSON.parse(payload) : payload

  //   const sig = await ledger.signEIP712Message(accountPath, jsonMessage)
  //   sig.r = "0x" + sig.r
  //   sig.s = "0x" + sig.s
  //   return ethers.utils.joinSignature(sig) as `0x${string}`
  // }

  if (method === "eth_signTypedData_v4") {
    const jsonMessage = typeof payload === "string" ? JSON.parse(payload) : payload

    // at this time we cannot use ledger.signEIP712Message() (see comments above) without altering the payload (missing salt & wrong time for chainId)
    // => let's hash using MM libraries, what's annoying is that the user will only see those hashes on his ledger

    const { domain, types, primaryType, message } = TypedDataUtils.sanitizeData(jsonMessage)
    const domainSeparatorHex = TypedDataUtils.hashStruct(
      "EIP712Domain",
      domain,
      types,
      SignTypedDataVersion.V4
    ).toString("hex")
    const hashStructMessageHex = TypedDataUtils.hashStruct(
      primaryType as string,
      message,
      types,
      SignTypedDataVersion.V4
    ).toString("hex")

    const sig = await ledger.signEIP712HashedMessage(
      accountPath,
      domainSeparatorHex,
      hashStructMessageHex
    )
    sig.r = "0x" + sig.r
    sig.s = "0x" + sig.s
    return ethers.utils.joinSignature(sig) as `0x${string}`
  }
  if (method === "personal_sign") {
    // ensure that it is hex encoded
    const messageHex = isHexString(payload) ? payload : bufferToHex(Buffer.from(payload, "utf8"))

    const sig = await ledger.signPersonalMessage(accountPath, stripHexPrefix(messageHex))
    sig.r = "0x" + sig.r
    sig.s = "0x" + sig.s
    return ethers.utils.joinSignature(sig) as `0x${string}`
  }
  if (method === "eth_sendTransaction") {
    const {
      accessList,
      to,
      nonce,
      gasLimit,
      gasPrice,
      data,
      value,
      chainId,
      type,
      maxPriorityFeePerGas,
      maxFeePerGas,
    } = await ethers.utils.resolveProperties(payload as ethers.providers.TransactionRequest)

    const baseTx: ethers.utils.UnsignedTransaction = {
      to,
      gasLimit,
      chainId,
      type,
    }

    if (nonce !== undefined) baseTx.nonce = ethers.BigNumber.from(nonce).toNumber()
    if (maxPriorityFeePerGas) baseTx.maxPriorityFeePerGas = maxPriorityFeePerGas
    if (maxFeePerGas) baseTx.maxFeePerGas = maxFeePerGas
    if (gasPrice) baseTx.gasPrice = gasPrice
    if (data) baseTx.data = data
    if (value) baseTx.value = value
    if (accessList) baseTx.accessList = accessList

    const unsignedTx = stripHexPrefix(ethers.utils.serializeTransaction(baseTx))
    const sig = await ledger.signTransaction(accountPath, unsignedTx, null) // resolver)

    return ethers.utils.serializeTransaction(baseTx, {
      v: ethers.BigNumber.from("0x" + sig.v).toNumber(),
      r: "0x" + sig.r,
      s: "0x" + sig.s,
    }) as `0x${string}`
  }

  // sign typed data v0, v1, v3...
  throw new Error(i18next.t("This type of message cannot be signed with ledger."))
}

const SignLedgerEthereum: FC<SignHardwareEthereumProps> = ({
  account,
  className = "",
  method,
  payload,
  containerId,
  onSentToDevice,
  onSigned,
  onCancel,
}) => {
  const { t } = useTranslation("request")
  const [isSigning, setIsSigning] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { ledger, refresh, status, message, isReady, requiresManualRetry } = useLedgerEthereum()

  // reset
  useEffect(() => {
    setIsSigned(false)
  }, [method, payload])

  const connectionStatus: LedgerConnectionStatusProps = useMemo(
    () => ({
      status: status === "ready" ? "connecting" : status,
      message: status === "ready" ? t("Please approve from your Ledger.") : message,
      refresh,
      requiresManualRetry,
    }),
    [refresh, status, message, requiresManualRetry, t]
  )

  const _onRefresh = useCallback(() => {
    refresh()
    setError(null)
  }, [refresh, setError])

  const signLedger = useCallback(async () => {
    if (!ledger || !onSigned) {
      return
    }

    setError(null)
    try {
      const signature = await signWithLedger(
        ledger,
        method,
        payload,
        (account as AccountJsonHardwareEthereum).path
      )
      setIsSigned(true)

      // await so we can keep the spinning loader until popup closes
      await onSigned({ signature })
    } catch (err) {
      const error = err as Error & { statusCode?: number; reason?: string }
      // if user rejects from device
      if (error.statusCode === 27013) return

      log.error("ledger sign Ethereum", { error })

      // ETH ledger app requires EIP-1559 type 2 transactions
      if (error.reason === "invalid object key - maxPriorityFeePerGas")
        setError(
          t("Sorry, Talisman doesn't support signing transactions with Ledger on this network.")
        )
      else setError(error.reason ?? error.message)
    }
  }, [ledger, onSigned, method, payload, account, t])

  const handleSendClick = useCallback(() => {
    setIsSigning(true)
    onSentToDevice?.(true)
    signLedger()
      .catch(() => onSentToDevice?.(false))
      .finally(() => setIsSigning(false))
  }, [onSentToDevice, signLedger])

  return (
    <div className={classNames("flex w-full flex-col gap-6", className)}>
      {!error && (
        <>
          {isReady ? (
            <Button className="w-full" primary processing={isSigning} onClick={handleSendClick}>
              {t("Approve on Ledger")}
            </Button>
          ) : (
            !isSigned && (
              <LedgerConnectionStatus {...{ ...connectionStatus }} refresh={_onRefresh} />
            )
          )}
        </>
      )}
      {onCancel && (
        <Button className="w-full" onClick={onCancel}>
          {t("Cancel")}
        </Button>
      )}
      {error && (
        <Drawer anchor="bottom" isOpen containerId={containerId}>
          {/* Shouldn't be a LedgerSigningStatus, just an error message */}
          <LedgerSigningStatus
            message={error ? error : ""}
            status={error ? "error" : isSigning ? "signing" : undefined}
            confirm={onCancel}
          />
        </Drawer>
      )}
    </div>
  )
}

// default export to allow for lazy loading
export default SignLedgerEthereum
