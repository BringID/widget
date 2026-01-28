const isValidOAuthMessage = (message: any): boolean => {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.domain === 'string' &&
    typeof message.user_id === 'string' &&
    typeof message.timestamp === 'number'
  )
}


 export default isValidOAuthMessage