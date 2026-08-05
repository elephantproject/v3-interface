import { getAddress } from '@ethersproject/address'
import NftMarketplaceArtifact from 'elephant-nft-marketplace/build/ElephantNFTMarketplace.json'
import GovernanceTokenArtifact from 'elephantdexcontracts/build/GovernanceToken.json'
import MasterBreederArtifact from 'elephantdexcontracts/build/MasterBreeder.json'
import PitArtifact from 'elephantdexcontracts/build/Pit.json'
import PitBreederArtifact from 'elephantdexcontracts/build/PitBreeder.json'
import NftArtifact from 'elephantdexnftcontracts/build/NFT.json'

import {
  ELEPHANT_MASTER_BREEDER_ADDRESS,
  ELEPHANT_NFT_ADDRESS,
  ELEPHANT_NFT_MARKETPLACE_ADDRESS,
  ELEPHANT_PIT_ADDRESS,
  ELEPHANT_PIT_BREEDER_ADDRESS,
  ELEPHANT_PIT_FEE_PAIRS,
  ELEPHANT_TOKEN_ADDRESS,
} from './elephant'

function functionNames(artifact: { abi: Array<{ type?: string; name?: string }> }) {
  return artifact.abi.filter(({ type }) => type === 'function').map(({ name }) => name)
}

describe('production Elephant contracts', () => {
  it.each([
    ELEPHANT_TOKEN_ADDRESS,
    ELEPHANT_PIT_ADDRESS,
    ELEPHANT_PIT_BREEDER_ADDRESS,
    ELEPHANT_MASTER_BREEDER_ADDRESS,
    ELEPHANT_NFT_ADDRESS,
    ELEPHANT_NFT_MARKETPLACE_ADDRESS,
  ])('uses a valid EVM address', (address) => {
    expect(getAddress(address)).toBeTruthy()
  })

  it('ships the Pit transaction ABI', () => {
    expect(functionNames(PitArtifact)).toEqual(expect.arrayContaining(['enter', 'leave', 'balanceOf', 'totalSupply']))
    expect(functionNames(PitBreederArtifact)).toContain('convertMultiple')
    expect(functionNames(GovernanceTokenArtifact)).toEqual(
      expect.arrayContaining(['approve', 'canUnlockAmount', 'unlock'])
    )
  })

  it('uses the production Pit fee-pair allowlist', () => {
    expect(ELEPHANT_PIT_FEE_PAIRS).toHaveLength(39)
    for (const pair of ELEPHANT_PIT_FEE_PAIRS) {
      expect(pair).toHaveLength(2)
      expect(getAddress(pair[0])).toBeTruthy()
      expect(getAddress(pair[1])).toBeTruthy()
    }
    expect(ELEPHANT_PIT_FEE_PAIRS[0].map((address) => address.toLowerCase())).toEqual([
      '0xcf664087a5bb0237a0bad6742852ec6c8d69a27a',
      ELEPHANT_TOKEN_ADDRESS.toLowerCase(),
    ])
  })

  it('ships the archived farm transaction ABI', () => {
    expect(functionNames(MasterBreederArtifact)).toEqual(expect.arrayContaining(['poolInfo', 'userInfo', 'withdraw']))
  })

  it('ships the production NFT marketplace transaction ABI', () => {
    expect(functionNames(NftArtifact)).toEqual(expect.arrayContaining(['mint', 'walletOfOwner', 'approve', 'tokenURI']))
    expect(functionNames(NftMarketplaceArtifact)).toEqual(
      expect.arrayContaining(['listNFT', 'buyNFT', 'updateListingPrice', 'cancelListing'])
    )
  })
})
