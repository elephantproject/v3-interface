import { Trans } from '@lingui/macro'
import { ELEPHANT_CASINO_URL } from 'constants/elephant'
import { NavLink, NavLinkProps } from 'react-router-dom'
import styled from 'styled-components/macro'

const Overlay = styled.div`
  display: none;

  @media screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg - 1}px`}) {
    position: fixed;
    top: ${({ theme }) => theme.navHeight}px;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 18px 16px 32px;
    background: ${({ theme }) => theme.backgroundSurface};
    border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  }
`

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`

const SectionLabel = styled.div`
  margin: 20px 12px 6px;
  color: ${({ theme }) => theme.textTertiary};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const linkStyles = `
  display: flex;
  align-items: center;
  min-height: 50px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
`

function ActiveNavLink({ className, ...props }: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) => `${typeof className === 'string' ? className : ''}${isActive ? ' active' : ''}`}
    />
  )
}

const MobileNavLink = styled(ActiveNavLink)`
  ${linkStyles}
  color: ${({ theme }) => theme.textSecondary};

  &:hover,
  &.active {
    color: ${({ theme }) => theme.textPrimary};
    background: ${({ theme }) => theme.backgroundFloating};
  }
`

const MobileExternalLink = styled.a`
  ${linkStyles}
  color: ${({ theme }) => theme.textSecondary};

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    background: ${({ theme }) => theme.backgroundFloating};
  }
`

const SocialLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;

  a {
    justify-content: center;
    min-height: 44px;
    padding: 8px;
    font-size: 14px;
  }
`

interface MobileMenuProps {
  onClose: () => void
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <Overlay role="dialog" aria-modal="true" aria-label="ElephantSwap navigation">
      <Navigation>
        <MobileNavLink to="/swap" onClick={onClose}>
          <Trans>Swap</Trans>
        </MobileNavLink>
        <MobileNavLink to="/pools" onClick={onClose}>
          <Trans>Pools</Trans>
        </MobileNavLink>
        <MobileNavLink to="/analytics" onClick={onClose}>
          <Trans>Analytics</Trans>
        </MobileNavLink>
        <MobileNavLink to="/pit" onClick={onClose}>
          <Trans>xElephant</Trans>
        </MobileNavLink>

        <SectionLabel>
          <Trans>Staking</Trans>
        </SectionLabel>
        <MobileNavLink to="/staking" onClick={onClose}>
          <Trans>Archived V2 farms</Trans>
        </MobileNavLink>
        <MobileNavLink to="/unlock" onClick={onClose}>
          <Trans>Unlock ELEPHANT</Trans>
        </MobileNavLink>

        <SectionLabel>
          <Trans>NFT</Trans>
        </SectionLabel>
        <MobileNavLink to="/nft/overview" onClick={onClose}>
          <Trans>Overview</Trans>
        </MobileNavLink>
        <MobileNavLink to="/nft" end onClick={onClose}>
          <Trans>Elephant NFT</Trans>
        </MobileNavLink>
        <MobileNavLink to="/nft/account" onClick={onClose}>
          <Trans>View NFTs</Trans>
        </MobileNavLink>

        <SectionLabel>
          <Trans>Community</Trans>
        </SectionLabel>
        <MobileExternalLink href={ELEPHANT_CASINO_URL} target="_blank" rel="noreferrer" onClick={onClose}>
          <Trans>Casino</Trans>
        </MobileExternalLink>
        <SocialLinks>
          <MobileExternalLink href="https://discord.gg/Dyd5t4SESH" target="_blank" rel="noreferrer">
            Discord
          </MobileExternalLink>
          <MobileExternalLink href="https://twitter.com/elephant_dex" target="_blank" rel="noreferrer">
            Twitter
          </MobileExternalLink>
          <MobileExternalLink href="https://github.com/elephantproject" target="_blank" rel="noreferrer">
            GitHub
          </MobileExternalLink>
        </SocialLinks>
      </Navigation>
    </Overlay>
  )
}
