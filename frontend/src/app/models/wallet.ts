export interface NonceRequest {
  address: string
}

export interface NonceResponse {
  nonce: string
}

export interface VerifySignatureRequest {
  address: string,
  signature: string
}


