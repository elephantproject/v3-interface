import { TransactionResponse } from '@ethersproject/abstract-provider'

function errorText(error: any): string {
  const values: string[] = []
  let current = error
  while (current) {
    if (typeof current.message === 'string') values.push(current.message)
    if (typeof current.reason === 'string') values.push(current.reason)
    current = current.error ?? current.data?.originalError
  }
  return values.join(' ')
}

/**
 * Harmony RPC nodes can omit the EIP-2718 `type` field from a valid receipt.
 * Some injected providers then throw after broadcast even though the transaction
 * hash is already available. Recover only that narrow post-broadcast failure.
 */
export function recoverReceiptDeserializationTransaction(error: any): TransactionResponse | undefined {
  const message = errorText(error)
  if (!/receipt/i.test(message) || !/(deserializ|missing field.*type)/i.test(message)) return undefined

  const hash =
    error?.transactionHash ??
    error?.receipt?.transactionHash ??
    error?.transaction?.hash ??
    message.match(/0x[a-fA-F0-9]{64}/)?.[0]
  if (!hash) return undefined

  return { hash, nonce: error?.transaction?.nonce } as TransactionResponse
}
