import { describe, it, expect } from 'vitest'
import { decodeEntities } from '../decodeEntities'

describe('decodeEntities', () => {
  it('decodes &quot; to "', () => {
    expect(decodeEntities('El &quot;Ceuta&quot; gana')).toBe('El "Ceuta" gana')
  })

  it('decodes &amp; to &', () => {
    expect(decodeEntities('Ceuta &amp; Melilla')).toBe('Ceuta & Melilla')
  })

  it('decodes &apos; to \'', () => {
    expect(decodeEntities('L&apos;equip')).toBe("L'equip")
  })

  it('decodes &lt; and &gt;', () => {
    expect(decodeEntities('&lt;p&gt;texto&lt;/p&gt;')).toBe('<p>texto</p>')
  })

  it('decodes typographic quotes &#8220; &#8221;', () => {
    expect(decodeEntities('&#8220;Victoria&#8221;')).toBe('“Victoria”')
  })

  it('decodes typographic apostrophe &#8217;', () => {
    expect(decodeEntities('L&#8217;equip')).toBe('L’equip')
  })

  it('decodes em dash &#8212;', () => {
    expect(decodeEntities('Ceuta&#8212;Algeciras')).toBe('Ceuta—Algeciras')
  })

  it('decodes en dash &#8211;', () => {
    expect(decodeEntities('3&#8211;0')).toBe('3–0')
  })

  it('decodes arbitrary numeric entities like &#233; → é', () => {
    expect(decodeEntities('caf&#233;')).toBe('café')
  })

  it('removes unknown named entities', () => {
    expect(decodeEntities('texto&nbsp;texto')).toBe('textotexto')
  })

  it('leaves plain text untouched', () => {
    expect(decodeEntities('AD Ceuta FC gana 2-0')).toBe('AD Ceuta FC gana 2-0')
  })

  it('handles empty string', () => {
    expect(decodeEntities('')).toBe('')
  })

  it('handles multiple entities in one string', () => {
    expect(decodeEntities('&quot;Ceuta &amp; Melilla&quot;')).toBe('"Ceuta & Melilla"')
  })
})
