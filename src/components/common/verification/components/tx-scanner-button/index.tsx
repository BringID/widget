import { FC, useEffect, useState } from 'react'
import TProps from './types'
import { Button } from '@/components/common'
import { taskManagerApi } from '@/app/content/api'
import { useConfigs } from '@/app/content/store/reducers/configs'
import { defineExplorerURL } from '@/utils'

const TXScannerButton: FC<TProps> = ({
  taskId
}) => {
  const userConfigs = useConfigs()
  const [ loading, setLoading ] = useState<boolean>(true)
  const [ txHash, setTxHash ] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      if (!taskId) {
        return alert('taskId not defined')
      }
      setLoading(true)
      try {
        const result = await taskManagerApi.getVerification(taskId, userConfigs.modeConfigs)

        if (result) {
          const { task } = result

          setTxHash(task.tx_hash)
        }
      } catch (err) {
        alert('verification fetch has failed')
      }
      setLoading(false)
    }

    init()

  }, [])

  return <Button
    loading={loading}
    appearance='action'
    onClick={() => {
      if (!txHash) {
        return alert('txHash is not ready. Please try in few seconds')
      }
      window.open(`${defineExplorerURL(Number(userConfigs.modeConfigs.CHAIN_ID || '8453'))}/tx/${txHash}`)

    }}
    size="small"
  >
    Check TX
  </Button>

}

export default TXScannerButton