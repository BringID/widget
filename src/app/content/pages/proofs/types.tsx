import { TSemaphoreProof } from "@/types"

export type TProps = {
  onConfirm: (
    proofs: TSemaphoreProof[],
    pointsSelected: number
  ) => void
  onCancel: () => void
}