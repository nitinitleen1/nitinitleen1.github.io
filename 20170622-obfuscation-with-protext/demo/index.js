const opentype = require('opentype.js')

const charset = Array.from('abcdefghijklmnopqrstuvwxyz')
const reversedCharset = charset.slice().reverse()

const sourceFont = opentype.loadSync('./font.ttf')

const notdefGlyph = new opentype.Glyph({ advanceWidth: 1 })

const glyphs = [notdefGlyph].concat(
    charset.map((sourceChar, i) => {
        const sourceGlyph = sourceFont.charToGlyph(sourceChar)

        const targetChar = reversedCharset[i]
        const targetGlyph = new opentype.Glyph(
            sourceFont.charToGlyph(targetChar)
        )

        targetGlyph.path = sourceGlyph.path
        targetGlyph.advanceWidth = sourceGlyph.advanceWidth

        return targetGlyph
    })
)

const targetFont = new opentype.Font({
    familyName: 'reverse',
    styleName: 'regular',

    unitsPerEm: sourceFont.unitsPerEm,
    ascender: sourceFont.ascender,
    descender: sourceFont.descender,

    glyphs,
})

targetFont.download('font-reverse.ttf')
