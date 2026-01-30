const isValidAuthErrorPayload = (payload: any): boolean => {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.error === 'string'
  )
}

export default isValidAuthErrorPayload