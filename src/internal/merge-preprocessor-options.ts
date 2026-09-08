export interface ScssModuleDefaults {
  additionalData: string
  silenceDeprecations: string[]
}

function mergePreprocessorOptions(
  moduleDefaults: ScssModuleDefaults,
  userOpts: Record<string, unknown> | undefined,
  joiner: string,
): Record<string, unknown> {
  const userAdditionalData = userOpts?.additionalData
  const additionalData = typeof userAdditionalData !== 'string'
    ? moduleDefaults.additionalData
    : userAdditionalData === ''
      ? userAdditionalData
      : userAdditionalData === moduleDefaults.additionalData
        || userAdditionalData.startsWith(`${moduleDefaults.additionalData}${joiner}`)
        ? userAdditionalData
        : [moduleDefaults.additionalData, userAdditionalData].join(joiner)

  const userSilenceDeprecations = userOpts?.silenceDeprecations
  // Keep module entries first, followed by any user-only entries.
  const silenceDeprecations = Array.isArray(userSilenceDeprecations)
    ? [...new Set([...moduleDefaults.silenceDeprecations, ...userSilenceDeprecations])]
    : moduleDefaults.silenceDeprecations

  return {
    ...userOpts,
    additionalData,
    silenceDeprecations,
  }
}

export function mergeScssOptions(
  moduleDefaults: ScssModuleDefaults,
  userOpts?: Record<string, unknown>,
): Record<string, unknown> {
  return mergePreprocessorOptions(moduleDefaults, userOpts, ';\n')
}

export function mergeSassOptions(
  moduleDefaults: ScssModuleDefaults,
  userOpts?: Record<string, unknown>,
): Record<string, unknown> {
  return mergePreprocessorOptions(moduleDefaults, userOpts, '\n')
}
