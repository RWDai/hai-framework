// @vitest-environment jsdom
import { flushSync, mount, unmount } from 'svelte'
import { describe, expect, it } from 'vitest'
import { EncryptedInput } from '../src/lib/components/scenes/crypto/index.js'

describe('encryptedInput', () => {
  it('未配置加密时中文输入不会产生伪密文', async () => {
    const target = document.createElement('div')
    document.body.append(target)
    const component = mount(EncryptedInput, { target, props: { showEncrypted: true } })
    try {
      flushSync()
      const input = target.querySelector('input')!
      input.value = '中文 🔐'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      flushSync()
      expect(target.querySelector('[role="status"]')).not.toBeNull()
      expect(target.querySelector('code')).toBeNull()
    }
    finally {
      await unmount(component)
      target.remove()
    }
  })
})
