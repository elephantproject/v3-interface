import { ButtonPrimary, ButtonSecondary } from "components/Button";
import styled from "styled-components/macro";

export const ElephantPage = styled.div`
  width: min(1120px, calc(100% - 32px));
  margin: 24px auto 64px;
`;

export const ElephantCard = styled.section`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  background: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.shallowShadow};
`;

export const ElephantHero = styled(ElephantCard)`
  color: ${({ theme }) => theme.accentTextLightPrimary};
  background: linear-gradient(135deg, #167965, #7e321b);
  border-color: transparent;
`;

export const PageTitle = styled.h1`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 32px;
  margin: 0 0 8px;
`;

export const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

export const Field = styled.input`
  width: 100%;
  padding: 14px 16px;
  color: ${({ theme }) => theme.textPrimary};
  background: ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  font-size: 18px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.accentAction};
  }
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;

  > button,
  > a {
    flex: 1 1 160px;
  }
`;

export const PrimaryAction = styled(ButtonPrimary)`
  border-radius: 12px;
  font-size: 16px;
  padding: 12px 16px;
`;

export const SecondaryAction = styled(ButtonSecondary)`
  border-radius: 12px;
  font-size: 16px;
  padding: 12px 16px;
`;

export const Notice = styled.p<{ $error?: boolean }>`
  color: ${({ $error, theme }) =>
    $error ? theme.accentFailure : theme.textSecondary};
  margin: 12px 0 0;
  overflow-wrap: anywhere;
`;
