import { RequestID } from "@core/domains/signing/types"
import {
  EthSignMessageRequestProvider,
  EthSignTransactionRequestProvider,
} from "@ui/domains/Sign/SignRequestContext"
import useSigningRequestById from "@ui/hooks/useSigningRequestById"
import { useParams } from "react-router-dom"

import { EthSignMessageRequest } from "./EthSignMessageRequest"
import { EthSignTransactionRequest } from "./EthSignTransactionRequest"

export const EthereumSignRequest = () => {
  const { id } = useParams<"id">() as { id: RequestID<"eth-send"> | RequestID<"eth-sign"> }
  const signingRequest = useSigningRequestById(id)
  if (!signingRequest) return null

  switch (signingRequest.type) {
    case "eth-send":
      return (
        <EthSignTransactionRequestProvider id={signingRequest.id}>
          <EthSignTransactionRequest />
        </EthSignTransactionRequestProvider>
      )
    case "eth-sign":
      return (
        <EthSignMessageRequestProvider id={signingRequest.id}>
          <EthSignMessageRequest />
        </EthSignMessageRequestProvider>
      )
    default:
      return null
  }
}
