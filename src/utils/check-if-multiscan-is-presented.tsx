type TCheckIfMultiscanIsPresented = (
  multiscanQRId: string
) => false | {
  scanID: string
  scanIDSig: string
}

const checkIfMultiscanIsPresented: TCheckIfMultiscanIsPresented = (multiscanQRId) => {
  if (!window.localStorage) { return false }
  const multiscanQRIdData = window.localStorage.getItem(multiscanQRId)
  if (!multiscanQRIdData) { return false }
  const multiscanQRIdDataParsed = JSON.parse(multiscanQRIdData)
  return multiscanQRIdDataParsed
}

export default checkIfMultiscanIsPresented
