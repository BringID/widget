import TTask from '@/types/task'
import TOAuthMessage from '@/types/oauth-message'

export type TFarcasterCompleteData = {
  message: TOAuthMessage
  signature: string
}

export type TProps = {
  task: TTask
  isMiniApp: boolean
  onComplete: (data: TFarcasterCompleteData) => void
  onError: (error: string) => void
  onClose: () => void
}
