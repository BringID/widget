import { TOAuthMessage } from "@/types";

type TVerifyResponse = {
  signature: string;
  attestation: {
    credential_id: string;
    app_id: string;
    issued_at: number;
  }
}

type TVerify = (
  apiUrl: string,
  presentationData: string,
  registry: string,
  credentialGroupId: string,
  appId: string,
  semaphoreIdentityCommitment: string,
  mode: string
) => Promise<TVerifyResponse>;


type TVerifyOAuth = (
  apiUrl: string,
  message: TOAuthMessage,
  signature: string,
  registry: string,
  credentialGroupId: string,
  appId: string,
  semaphoreIdentityCommitment: string,
  mode: string
) => Promise<TVerifyResponse>;

export type { TVerify, TVerifyResponse, TVerifyOAuth };
