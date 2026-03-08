import { FC, useState } from 'react'
import { ButtonStyled } from './styled-components'
import configs from '@/app/configs'
import { usePlausible } from 'next-plausible'
import { useUser } from '@/app/content/store/reducers/user'

const InstallExtensionButton: FC = () => {
  const [
    installationStarted,
    setInstallationStarted
  ] = useState<boolean>(false)
  const plausible = usePlausible()
  const user = useUser()

  if (installationStarted) {
    return <ButtonStyled
      appearance='action'
      onClick={() => {
        window.postMessage({
          type: 'CLOSE_MODAL',
        }, window.location.origin)
        window.location.reload()
      }}
    >
      Reload
    </ButtonStyled>
  }

  return <ButtonStyled
    appearance='action'
    onClick={() => {
      plausible('extension_install_clicked')
      if (user.isMiniApp) {
        window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url: configs.EXTENSION_URL } }, window.location.origin)
      } else {
        window.open(configs.EXTENSION_URL, '_blank')
      }
      setInstallationStarted(true)
    }}
  >
    Install
  </ButtonStyled>
}

export default InstallExtensionButton