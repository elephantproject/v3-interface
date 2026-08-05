import NftMarketplaceArtifact from "elephant-nft-marketplace/build/ElephantNFTMarketplace.json";
import GovernanceTokenArtifact from "elephantdexcontracts/build/GovernanceToken.json";
import MasterBreederArtifact from "elephantdexcontracts/build/MasterBreeder.json";
import PitArtifact from "elephantdexcontracts/build/Pit.json";
import PitBreederArtifact from "elephantdexcontracts/build/PitBreeder.json";
import NftArtifact from "elephantdexnftcontracts/build/NFT.json";

import {
  ELEPHANT_MASTER_BREEDER_ADDRESS,
  ELEPHANT_NFT_ADDRESS,
  ELEPHANT_NFT_MARKETPLACE_ADDRESS,
  ELEPHANT_PIT_ADDRESS,
  ELEPHANT_PIT_BREEDER_ADDRESS,
  ELEPHANT_TOKEN_ADDRESS,
} from "../constants/elephant";
import { useContract } from "./useContract";

const GOVERNANCE_TOKEN_ABI = GovernanceTokenArtifact.abi;
const MASTER_BREEDER_ABI = MasterBreederArtifact.abi;
const PIT_ABI = PitArtifact.abi;
const PIT_BREEDER_ABI = PitBreederArtifact.abi;
const NFT_ABI = NftArtifact.abi;
const NFT_MARKETPLACE_ABI = NftMarketplaceArtifact.abi;

export function useElephantTokenContract(withSignerIfPossible = true) {
  return useContract(
    ELEPHANT_TOKEN_ADDRESS,
    GOVERNANCE_TOKEN_ABI,
    withSignerIfPossible
  );
}

export function useElephantPitContract(withSignerIfPossible = true) {
  return useContract(ELEPHANT_PIT_ADDRESS, PIT_ABI, withSignerIfPossible);
}

export function useElephantPitBreederContract(withSignerIfPossible = true) {
  return useContract(
    ELEPHANT_PIT_BREEDER_ADDRESS,
    PIT_BREEDER_ABI,
    withSignerIfPossible
  );
}

export function useElephantMasterBreederContract(withSignerIfPossible = true) {
  return useContract(
    ELEPHANT_MASTER_BREEDER_ADDRESS,
    MASTER_BREEDER_ABI,
    withSignerIfPossible
  );
}

export function useElephantNftContract(withSignerIfPossible = true) {
  return useContract(ELEPHANT_NFT_ADDRESS, NFT_ABI, withSignerIfPossible);
}

export function useElephantNftMarketplaceContract(withSignerIfPossible = true) {
  return useContract(
    ELEPHANT_NFT_MARKETPLACE_ADDRESS,
    NFT_MARKETPLACE_ABI,
    withSignerIfPossible
  );
}
