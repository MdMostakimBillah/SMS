import { describe, it, expect, beforeEach } from 'vitest'
import { collectLocalStores } from './backup'

describe('backup STORE_BASE_KEYS and collectLocalStores', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('includes edutech-online in collected stores', () => {
    sessionStorage.setItem('edutech_inst_slug', 'demo-school')
    localStorage.setItem(
      'edutech-online_demo-school',
      JSON.stringify({
        state: {
          classes: [
            {
              id: 'OC-1',
              title: 'Physics Live',
              platform: 'youtube',
              url: 'https://youtube.com/watch?v=123',
            },
          ],
        },
      })
    )

    const bundle = collectLocalStores('demo-school')
    expect(bundle.stores['edutech-online']).toBeDefined()
    expect(bundle.stores['edutech-online'].state.classes).toHaveLength(1)
    expect(bundle.stores['edutech-online'].state.classes[0].title).toBe('Physics Live')
  })
})
