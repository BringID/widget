export type TWidgetMessage = {
  type: string
  requestId?: string
  payload?: Record<string, any>
}

export default TWidgetMessage