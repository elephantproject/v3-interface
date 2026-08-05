import { Trans } from '@lingui/macro'
import Web3Status from 'components/Web3Status'
import { ELEPHANT_CASINO_URL } from 'constants/elephant'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { ReactNode, useEffect, useState } from 'react'
import { Menu as MenuIcon, X } from 'react-feather'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { Bag } from './Bag'
import Blur from './Blur'
import { ChainSelector } from './ChainSelector'
import { ElephantBalance } from './ElephantBalance'
import { ElephantNavDropdown } from './ElephantNavDropdown'
import { MenuDropdown } from './MenuDropdown'
import { MobileMenu } from './MobileMenu'
import * as styles from './style.css'

const Nav = styled.nav`
  padding: ${({ theme }) => `${theme.navVerticalPad}px 12px`};
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: 2;
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
}

const MenuItem = ({ href, dataTestId, id, isActive, children }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none' }}
      data-testid={dataTestId}
    >
      {children}
    </NavLink>
  )
}

const ExternalMenuItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 12px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    background: ${({ theme }) => theme.stateOverlayHover};
  }
`

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  color: ${({ theme }) => theme.textPrimary};
  background: ${({ theme }) => theme.backgroundSurface};
  cursor: pointer;

  @media screen and (min-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    display: none;
  }
`

const PageTabs = () => {
  const { pathname } = useLocation()
  const isPoolActive = useIsPoolsPage()

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      <Box display={{ sm: 'flex', lg: 'none', xxl: 'flex' }} width="full">
        <MenuItem href="/pools" dataTestId="pool-nav-link" isActive={isPoolActive}>
          <Trans>Pools</Trans>
        </MenuItem>
      </Box>
      <MenuItem href="/analytics" isActive={pathname.startsWith('/analytics')}>
        <Trans>Analytics</Trans>
      </MenuItem>
      <ElephantNavDropdown
        label={<Trans>Staking</Trans>}
        items={[
          { to: '/staking', label: <Trans>Archived V2 farms</Trans> },
          { to: '/unlock', label: <Trans>Unlock ELEPHANT</Trans> },
        ]}
      />
      <MenuItem href="/pit" isActive={pathname.startsWith('/pit')}>
        <Trans>xElephant</Trans>
      </MenuItem>
      <ElephantNavDropdown
        label={<Trans>NFT</Trans>}
        items={[
          { to: '/nft/overview', label: <Trans>Overview</Trans> },
          { to: '/nft', label: <Trans>Elephant NFT</Trans> },
          { to: '/nft/account', label: <Trans>View NFTs</Trans> },
        ]}
      />
      <ExternalMenuItem href={ELEPHANT_CASINO_URL} target="_blank" rel="noreferrer">
        <Trans>Casino</Trans>
      </ExternalMenuItem>
      <Box marginY={{ sm: '4', md: 'unset' }}>
        <MenuDropdown />
      </Box>
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <img
                width="48"
                height="48"
                data-testid="harmony-logo"
                className={styles.logo}
                src="/elephantcoin.png"
                onClick={() => {
                  navigate({
                    pathname: '/',
                    search: '?intro=true',
                  })
                }}
              />
            </Box>
            <MobileMenuButton
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
            </MobileMenuButton>
            {!isNftPage && (
              <Box display={{ sm: 'flex', lg: 'none' }}>
                <ChainSelector leftAlign={true} />
              </Box>
            )}
            <Row display={{ sm: 'none', lg: 'flex' }}>
              <PageTabs />
            </Row>
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
              {!isNftPage && (
                <Box display={{ sm: 'none', lg: 'flex' }}>
                  <ChainSelector />
                </Box>
              )}

              <ElephantBalance />
              <Web3Status />
            </Row>
          </Box>
        </Box>
        {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
      </Nav>
    </>
  )
}

export default Navbar
