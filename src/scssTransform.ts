/* eslint-disable space-before-function-paren */
import type { Plugin } from 'vite'

const fileExt = /\.s[a|c]ss$/

export function getScssTransformPlugin(sassVariables: string | boolean): Plugin {
  const sassImportCode = ["@import 'quasar/src/css/variables.sass'", '']

  if (typeof sassVariables === 'string') {
    sassImportCode.unshift(`@import '${sassVariables}'`)
  }

  return {
    name: 'vite:quasar:scss',
    enforce: 'pre',
    transform(src: string, id: string) {
      const shouldTransform = id.match(fileExt)?.[0] || false
      if (shouldTransform) {
        const prefix = shouldTransform === '.sass'
          ? sassImportCode.join('\n')
          : sassImportCode.join(';\n')

        const useIndex = Math.max(
          src.lastIndexOf('@use '),
          src.lastIndexOf('@forward ')
        )

        const content = {
          code: src + '\n' + prefix,
          map: null
        }

        if (useIndex === -1) {
          content.code = prefix + src
        } else {
          const newLineIndex = src.indexOf('\n', useIndex)

          if (newLineIndex !== -1) {
            const index = newLineIndex + 1
            content.code = src.substring(0, index) + prefix + src.substring(index)
          }
        }

        return content
      }

      return null
    }
  }
}
