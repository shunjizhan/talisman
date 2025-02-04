import { log } from "@core/log"
import { chaindataProvider } from "@core/rpcs/chaindata"
import {
  getMetadataDef,
  getMetadataFromDef,
  getMetadataRpcFromDef,
} from "@core/util/getMetadataDef"
import { typesBundle } from "@polkadot/apps-config/api"
import { Metadata, TypeRegistry } from "@polkadot/types"
import { getSpecAlias, getSpecTypes } from "@polkadot/types-known/util"
import { hexToNumber, isHex } from "@polkadot/util"

// metadata may have been added manually to the store, for a chain that Talisman doesn't know about (not in chaindata)
// => use either chainId or genesisHash as identifier

/**
 *
 * @param chainIdOrHash chainId or genesisHash
 * @param specVersion specVersion of the metadata to be loaded (if not defined, will fetch latest)
 * @param blockHash if specVersion isn't specified, this is the blockHash where to fetch the correct metadata from (if not defined, will fetch latest)
 * @param signedExtensions signedExtensions from a transaction payload that has to be decoded or signed
 * @returns substrate type registry
 */
export const getTypeRegistry = async (
  chainIdOrHash: string,
  specVersion?: number | string,
  blockHash?: string,
  signedExtensions?: string[]
) => {
  const registry = new TypeRegistry()

  const chain = await (isHex(chainIdOrHash)
    ? chaindataProvider.getChain({ genesisHash: chainIdOrHash })
    : chaindataProvider.getChain(chainIdOrHash))

  // register typesBundle in registry for legacy (pre metadata v14) chains
  if (typesBundle.spec && chain?.specName && typesBundle.spec[chain.specName]) {
    const chainBundle =
      chain.chainName && typesBundle.chain?.[chain.chainName]
        ? { chain: { [chain.chainName]: typesBundle.chain[chain.chainName] } }
        : {}
    const specBundle =
      chain.specName && typesBundle.spec?.[chain.specName]
        ? { spec: { [chain.specName]: typesBundle.spec[chain.specName] } }
        : {}
    const legacyTypesBundle = { ...chainBundle, ...specBundle }

    if (legacyTypesBundle) {
      log.debug(`Setting known types for chain ${chain.id}`)
      registry.clearCache()
      registry.setKnownTypes({ typesBundle: legacyTypesBundle })
      if (chain.chainName) {
        registry.register(
          getSpecTypes(
            registry,
            chain.chainName,
            chain.specName,
            parseInt(chain.specVersion ?? "0", 10) ?? 0
          )
        )
        registry.knownTypes.typesAlias = getSpecAlias(registry, chain.chainName, chain.specName)
      }
    }
  }

  const numSpecVersion = typeof specVersion === "string" ? hexToNumber(specVersion) : specVersion
  const metadataDef = await getMetadataDef(chainIdOrHash, numSpecVersion, blockHash)
  const metadataRpc = metadataDef ? getMetadataRpcFromDef(metadataDef) : undefined

  if (metadataDef) {
    const metadataValue = getMetadataFromDef(metadataDef)
    if (metadataValue) {
      const metadata: Metadata = new Metadata(registry, metadataValue)
      registry.setMetadata(metadata)
    }

    if (signedExtensions || metadataDef.userExtensions)
      registry.setSignedExtensions(signedExtensions, metadataDef.userExtensions)
    if (metadataDef.types) registry.register(metadataDef.types)
  } else {
    if (signedExtensions) registry.setSignedExtensions(signedExtensions)
  }

  return { registry, metadataRpc }
}
