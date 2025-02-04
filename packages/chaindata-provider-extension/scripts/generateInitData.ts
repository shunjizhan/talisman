import fs from "fs"
import path from "path"

import { fetchChains, fetchEvmNetworks, fetchTokens } from "../src/graphql"

async function generateInitData() {
  fs.writeFileSync(
    path.resolve(__dirname, "../src/init/chains.json"),
    JSON.stringify(await fetchChains(), null, 2)
  )
  fs.writeFileSync(
    path.resolve(__dirname, "../src/init/evm-networks.json"),
    JSON.stringify(await fetchEvmNetworks(), null, 2)
  )
  fs.writeFileSync(
    path.resolve(__dirname, "../src/init/tokens.json"),
    JSON.stringify(await fetchTokens(), null, 2)
  )
}

// Use this command to run this file:
//
// ```
// yarn workspace @talismn/chaindata-provider-extension generate-init-data
// ```
generateInitData()
