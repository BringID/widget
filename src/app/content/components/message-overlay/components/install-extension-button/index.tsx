import { FC, useState } from 'react'
import { ButtonStyled } from './styled-components'
import configs from '@/app/configs'

const InstallExtensionButton: FC = () => {
  const [
    installationStarted,
    setInstallationStarted
  ] = useState<boolean>(false)


  if (installationStarted) {
    return <ButtonStyled
      appearance='action'
      onClick={() => window.location.reload()}
    >
      Reload
    </ButtonStyled>
  }

  return <ButtonStyled
    appearance='action'
    onClick={() => {
      window.open(configs.EXTENSION_URL, '_blank')
      setInstallationStarted(true)
    }}
  >
    Install
  </ButtonStyled>
}

export default InstallExtensionButton