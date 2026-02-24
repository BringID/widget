function isMobileDevice(): boolean {
  // Modern API — available in Chrome 90+, Edge (not Firefox/Safari)
  if (typeof navigator !== 'undefined' && 'userAgentData' in navigator) {
    return (navigator as any).userAgentData.mobile
  }
  // User agent fallback — covers iOS, Android, and generic mobile tokens
  return /android|iphone|ipad|ipod|mobile/i.test(navigator?.userAgent ?? '')
}

export default isMobileDevice
