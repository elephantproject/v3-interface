import { recoverReceiptDeserializationTransaction } from './recoverSubmittedTransaction'

describe('recoverReceiptDeserializationTransaction', () => {
  const hash = `0x${'12'.repeat(32)}`

  it('recovers a broadcast hash from Harmony receipt deserialization errors', () => {
    const recovered = recoverReceiptDeserializationTransaction(
      new Error(`Failure on receiving a receipt for ${hash}: deserialization error: missing field type`)
    )

    expect(recovered?.hash).toBe(hash)
  })

  it('does not recover a genuine revert', () => {
    const recovered = recoverReceiptDeserializationTransaction(
      new Error(`Transaction ${hash} reverted without a reason string`)
    )

    expect(recovered).toBeUndefined()
  })
})
