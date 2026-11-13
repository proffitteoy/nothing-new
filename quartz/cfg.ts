import type { ValidLocale } from "./i18n"
import type { PluginTypes } from "./plugins/types"
import type { Theme } from "./util/theme"

export interface GlobalConfiguration {
  ignorePatterns: string[]
  theme: Theme
  locale: ValidLocale
}

export interface QuartzConfig {
  configuration: GlobalConfiguration
  plugins: PluginTypes
}
