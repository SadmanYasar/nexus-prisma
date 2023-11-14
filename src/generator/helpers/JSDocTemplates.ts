import dedent from 'dindist'

import { DMMF } from '@prisma/client/runtime/library'

import { PrismaDocumentation } from '../../lib/prisma-documentation'
import type { Settings } from '../Settings'

type JSDoc = string

type FieldModelParams = {
  field: DMMF.Field
  model: DMMF.Model
  settings: Settings.Gentime.Manager
}

const jsdocIndent = '  '
const jsdocEmptyLine = `\n${jsdocIndent}*\n`

/**
 * Enum
 */

export const jsDocForEnum = (params: {
  enum: DMMF.DatamodelEnum
  settings: Settings.Gentime.Manager
}): JSDoc => {
  const sections = [
    enumIntro(params.enum),
    nodeDocumentation({
      enum: params.enum,
      settings: params.settings,
    }),
    `* Contains these members: ${params.enum.values.map((value) => value.name).join(', ')}`,
    enumExample(params.enum),
  ]
  const jsdoc = jsDocBookends(joinSections(sections))
  return jsdoc
}

const enumIntro = (enum_: DMMF.DatamodelEnum): string => {
  return dedent`
    * Generated Nexus \`enumType\` configuration based on your Prisma schema's enum \`${enum_.name}\`.
  `
}

const enumExample = (enum_: DMMF.DatamodelEnum): string => {
  return dedent`
    * @example
    *
    * import { enumType } from 'nexus'
    * import { ${enum_.name} } from 'nexus-prisma'
    *
    * enumType(${enum_.name})
  `
}

const enumMissingDocGuide = (enum_: DMMF.DatamodelEnum): string => {
  return dedent`
    ${missingDocsIntro({ kind: 'enum', enum: enum_ })}
    *
    * \`\`\`prisma
    * /// Lorem ipsum dolor sit amet...
    * enum ${enum_.name} {
    ${enum_.values.map((value) => `*   ${value.name}`).join('\n')}
    * }
    * \`\`\`
    * 
    ${missingDocsOutro}
  `
}

/**
 * Model
 */

export const jsDocForModel = (params: { model: DMMF.Model; settings: Settings.Gentime.Manager }): JSDoc => {
  const sections = [modelIntro(params.model), nodeDocumentation(params), modelExample(params.model)]
  const jsdoc = jsDocBookends(joinSections(sections))
  return jsdoc
}

const modelIntro = (model: DMMF.Model): string => {
  return dedent`
    * Generated Nexus \`objectType\` configuration based on your Prisma schema's model \`${model.name}\`.
  `
}

const nodeDocumentation = (
  params:
    | { settings: Settings.Gentime.Manager; model: DMMF.Model }
    | { settings: Settings.Gentime.Manager; model: DMMF.Model; field: DMMF.Field }
    | { settings: Settings.Gentime.Manager; enum: DMMF.DatamodelEnum },
): string | null => {
  const documentation =
    'field' in params
      ? params.field.documentation
      : 'model' in params
        ? params.model.documentation
        : 'enum' in params
          ? params.enum.documentation
          : null

  if (documentation) {
    return dedent`
      * ${PrismaDocumentation.format(documentation)}
    `
  }

  if (params.settings.data.jsdocPropagationDefault === 'guide') {
    return 'field' in params
      ? fieldMissingDocGuide({
          field: params.field,
          model: params.model,
          settings: params.settings,
        })
      : 'model' in params
        ? modelMissingDocGuide(params.model)
        : enumMissingDocGuide(params.enum)
  }

  return null
}

const modelMissingDocGuide = (model: DMMF.Model): string => {
  // TODO once https://stackoverflow.com/questions/61893953/how-to-escape-symbol-in-jsdoc-for-vscode
  // is resolved then we can write better examples below like: id String @id
  return dedent`
    ${missingDocsIntro({ kind: 'model', model })}
    * 
    * \`\`\`prisma
    * /// Lorem ipsum dolor sit amet...
    * model ${model.name} {
    *   foo  String
    * }
    * \`\`\`
    * 
    ${missingDocsOutro}
  `
}

const modelExample = (model: DMMF.Model): string => {
  return dedent`
    * @example
    *
    * import { objectType } from 'nexus'
    * import { ${model.name} } from 'nexus-prisma'
    *
    * objectType({
    *   name: ${model.name}.$name
    *   description: ${model.name}.$description
    *   definition(t) {
    *     t.field(${model.name}.id)
    *   }
    * })
  `
}

/**
 * Field
 */

export const jsDocForField = (params: FieldModelParams): JSDoc => {
  const sections = [fieldIntro(params), nodeDocumentation(params), fieldExample(params)]
  const jsdoc = jsDocBookends(joinSections(sections))
  return jsdoc
}

const fieldIntro = ({ model, field }: FieldModelParams): string => {
  return dedent`
    * Generated Nexus \`t.field\` configuration based on your Prisma schema's model-field \`${model.name}.${field.name}\`.
  `
}

const fieldMissingDocGuide = ({ model, field }: FieldModelParams): string => {
  return dedent`
    ${missingDocsIntro({ kind: 'model', model })}
    * \`\`\`prisma
    * model ${model.name} {
    *   /// Lorem ipsum dolor sit amet.
    *   ${field.name}  ${field.type}${field.isRequired ? '' : '?'}
    * }
    * \`\`\`
    *
    ${missingDocsOutro}
  `
}

const fieldExample = ({ model, field }: FieldModelParams): string => {
  return dedent`
    * @example
    *
    * import { objectType } from 'nexus'
    * import { ${model.name} } from 'nexus-prisma'
    *
    * objectType({
    *   name: ${model.name}.$name
    *   description: ${model.name}.$description
    *   definition(t) {
    *     t.field(${model.name}.${field.name})
    *   }
    * })
  `
}

/**
 * Helpers
 */

const missingDocsIntro = (
  info: { kind: 'model'; model: DMMF.Model } | { kind: 'enum'; enum: DMMF.DatamodelEnum } | { kind: 'field' },
): string => {
  const thisItem =
    info.kind === 'enum'
      ? `enum ${info.enum.name}`
      : info.kind === 'model'
        ? `model ${info.model.name}`
        : info.kind

  return dedent`
     * ### ️⚠️ You have not written documentation for ${thisItem}
     *
     * Replace this default advisory JSDoc with your own documentation about ${thisItem}
     * by documenting it in your Prisma schema. For example:
  `
}

const missingDocsOutro = `* Learn more about documentation comments in Prisma schema files [here](https://www.prisma.io/docs/concepts/components/prisma-schema#comments).`

/**
 * Convert a list of JSDoc sections into a single unified JSDoc section.
 *
 * Each joined section is separated by an empty line.
 *
 * Each section being joined is expected to handle its own JSDoc "spine" (e.g. `* some content here`).
 */
const joinSections = (sections: (string | null)[]) => {
  return sections.filter((section) => section !== null).join(jsdocEmptyLine + jsdocIndent)
}

const jsDocBookends = (content: string) => {
  const start = `/**`
  const end = '*/'
  const body = prefixBlock(jsdocIndent, content)

  return `${start}\n${body}\n${jsdocIndent}${end}`
}

const prefixBlock = (prefix: string, content: string): string => {
  return content
    .split('\n')
    .map((_) => `${prefix}${_.trim()}`)
    .join('\n')
}
