const generateId = (): string => {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

  export default generateId