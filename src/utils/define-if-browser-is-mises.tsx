function defineIfBrowserIsMises(): boolean {
  const ua = navigator.userAgent;

  const isMises = ua.includes('Mises')
  
  return isMises;
}
export default defineIfBrowserIsMises