import { FC } from 'react'
import { Container } from './styled-components'
import TProps from './types'
import Icons from '../icons'

const CloseButton: FC<TProps> = ({
  className,
  onClick
}) => {
  return <Container className={className} onClick={onClick}>
    <Icons.CloseIcon />
  </Container>
}

export default CloseButton