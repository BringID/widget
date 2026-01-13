const getConfigs = async (
  mode: string
) => {
  const REGISTRY = mode === 'dev' ? '0x0b2Ab187a6FD2d2F05fACc158611838c284E3a9c' : '0xFEA4133236B093eC727286473286A45c5d4443BC'
  const CHAIN_ID = mode === 'dev' ? '84532' : '8453'
  console.log({
    REGISTRY,
    CHAIN_ID
  })
  return {
    REGISTRY,
    CHAIN_ID
  }
}

export default getConfigs
