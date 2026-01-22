import { TSemaphoreProof } from "@/types"

export type TOnConfirm = (
  proofs: TSemaphoreProof[],
  pointsSelected: number
) => void

export type TOnCancel = () => void

export type TSetPage = (page: string) => void

export type TProps = {
  onConfirm: TOnConfirm
  onCancel: TOnCancel,
  setPage: TSetPage
}