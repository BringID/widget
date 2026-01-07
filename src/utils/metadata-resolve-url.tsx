const metadataUrlResolve = (ipfsUrl: string, tokenId: string): string => {
  if (ipfsUrl.indexOf('{id}') === -1) { return ipfsUrl }
  const tokenIdAsUrlString = `${new Array(64 - tokenId.length).fill(0).join('')}${tokenId}`
  return ipfsUrl.replace('{id}', tokenIdAsUrlString)
}

export default metadataUrlResolve
