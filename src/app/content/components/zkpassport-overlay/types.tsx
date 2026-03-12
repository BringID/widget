import TTask from '@/types/task'

export type TZKPassportCompleteData = {
  message: {
    domain: string
    userId: string
    score: number
    timestamp: number
  }
  signature: string
}

export type TProps = {
  task: TTask
  isMiniApp: boolean
  onComplete: (data: TZKPassportCompleteData) => void
  onError: (error: string) => void
  onClose: () => void
}
