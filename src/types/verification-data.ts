type TVerificationData = {
  signature: string
  verifier_hash: string
  verifier_message: {
    id_hash: string
  }
}

export default TVerificationData