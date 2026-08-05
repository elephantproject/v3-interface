import { useOnClickOutside } from "hooks/useOnClickOutside";
import { ChevronDown } from "react-feather";
import { ReactNode, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components/macro";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Trigger = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: 12px;
  color: ${({ $active, theme }) =>
    $active ? theme.textPrimary : theme.textSecondary};
  background: ${({ $active, theme }) =>
    $active ? theme.backgroundFloating : "transparent"};
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    background: ${({ theme }) => theme.stateOverlayHover};
  }
`;

const Flyout = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  min-width: 190px;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  background: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    top: auto;
    bottom: calc(100% + 8px);
  }
`;

const Item = styled(Link)`
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    background: ${({ theme }) => theme.stateOverlayHover};
  }
`;

export type ElephantNavItem = { to: string; label: ReactNode };

export function ElephantNavDropdown({
  label,
  items,
}: {
  label: ReactNode;
  items: ElephantNavItem[];
}) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, open ? () => setOpen(false) : undefined);
  const active = items.some(({ to }) => pathname.startsWith(to));

  return (
    <Wrapper ref={ref}>
      <Trigger $active={active} onClick={() => setOpen((value) => !value)}>
        {label}
        <ChevronDown size={15} />
      </Trigger>
      {open && (
        <Flyout>
          {items.map(({ to, label: itemLabel }) => (
            <Item key={to} to={to} onClick={() => setOpen(false)}>
              {itemLabel}
            </Item>
          ))}
        </Flyout>
      )}
    </Wrapper>
  );
}
