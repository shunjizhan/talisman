import { Navigate, Route, Routes } from "react-router-dom"
import { WagmiConfig } from "wagmi"

import { BehaviorPage } from "./behavior/BehaviorPage"
import { ContractPage } from "./contract/ContractPage"
import { ERC20Page } from "./erc20/ERC20Page"
import { ERC721Page } from "./erc721/ERC721Page"
import { NavEthereum } from "./NavEthereum"
import { wagmiClient } from "./shared/connectors"
import { SignPage } from "./sign/SignPage"
import { TransferPage } from "./transaction/TransferPage"

export const Ethereum = () => {
  return (
    <WagmiConfig client={wagmiClient}>
      <NavEthereum />
      <Routes>
        <Route path="transaction" element={<TransferPage />} />
        <Route path="contract" element={<ContractPage />} />
        <Route path="erc20" element={<ERC20Page />} />
        <Route path="erc721" element={<ERC721Page />} />
        <Route path="sign" element={<SignPage />} />
        <Route path="behavior" element={<BehaviorPage />} />
        <Route path="*" element={<Navigate to="transaction" />} />
      </Routes>
    </WagmiConfig>
  )
}
