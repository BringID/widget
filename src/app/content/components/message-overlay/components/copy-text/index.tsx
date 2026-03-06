import React, { FC, useState } from 'react'
import { Container, TextValue, CopyIconStyled, CopiedLabel } from './styled-components'

type TProps = {
  text: string
}

const CopyText: FC<TProps> = ({ text }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Container onClick={handleCopy}>
      <TextValue>{text}</TextValue>
      {copied ? <CopiedLabel>Copied!</CopiedLabel> : <CopyIconStyled />}
    </Container>
  )
}

export default CopyText
