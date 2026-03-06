import styled from 'styled-components'
import CopyIcon from '@/components/common/icons/copy'
import { Text } from '@/components/common'

export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid ${(props) => props.theme.primaryBorderColor};
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  word-break: break-all;
`

export const TextValue = styled(Text)`
  flex: 1;
  font-size: 12px;
  text-align: left;
  margin: 0;
`

export const CopyIconStyled = styled(CopyIcon)`
  flex-shrink: 0;
  color: ${(props) => props.theme.primaryTextColor};
`

export const CopiedLabel = styled(Text)`
  flex-shrink: 0;
  font-size: 12px;
  margin: 0;
`
