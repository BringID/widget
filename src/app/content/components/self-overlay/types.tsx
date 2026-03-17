import TTask from '@/types/task'

export type TSelfCompleteData = {
  message: {
    domain: string
    user_id: string
    score: number
    timestamp: number
  }
  signature: string
}

export type TProps = {
  task: TTask
  isMiniApp: boolean
  onComplete: (data: TSelfCompleteData) => void
  onError: (error: string) => void
  onClose: () => void
}
