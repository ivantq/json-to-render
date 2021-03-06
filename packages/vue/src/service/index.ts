import { createProxyService } from './proxy'
import { createHookService } from './hooks'
import { createDatasourceService } from './datasource'
import {
  createServiceBuilder,
  createFunctionalService,
} from '@json2render/core'

export const proxy = createProxyService()

export const prerender = createHookService()

export const render = createHookService()

export const datasource = createDatasourceService()

export const functional = createFunctionalService()

export const globalServiceBuilder = createServiceBuilder({
  proxy: proxy.setup,
  prerender: prerender.setup,
  render: render.setup,
  datasource: datasource.setup,
  functional: functional.setup,
})
