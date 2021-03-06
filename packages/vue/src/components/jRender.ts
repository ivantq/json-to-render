import {
  defineComponent,
  h,
  ref,
  resolveComponent,
  watch,
  toRaw,
  nextTick,
  onBeforeUnmount,
  reactive,
} from 'vue'
import { createFunctionalService, createProxyInjector } from '@json2render/core'
import { assignObject, isFunction, isArray } from '@json2render/utils'
import { createProxyService } from '../service/proxy'
import { createDatasourceService } from '../service/datasource'
import { createHookService } from '../service/hooks'
import { createComponentService } from '../service/component'
import { proxy, prerender, render, datasource, functional } from '../service'
import { createStore } from '../store'
import { innerDataNames } from '../utils/enums'
import JNode from './jNode'

export default defineComponent({
  name: 'vJrender',
  components: { [JNode.name]: JNode },
  props: {
    modelValue: { type: Object, default: () => ({}) },
    component: { type: String, default: 'div' },
    fields: { type: Array, default: () => [] },
    datasource: { type: Object, default: () => ({}) },
    listeners: { type: Array, default: () => [] },
  },
  emits: ['setup', 'update:modelValue'],
  setup: (props, ctx) => {
    const context: { [key: string]: any } = reactive({
      model: toRaw(props.modelValue),
      refs: {},
    })
    const root = reactive({ field: {}, scope: {} })
    const updating = ref(false) // 为了更新 fields 时从根节点刷新

    //#region 初始化服务相关
    const proxyService = createProxyService(proxy.store)
    const prerenderService = createHookService(prerender.store)
    const renderService = createHookService(render.store)
    const componentService = createComponentService()
    const datasourceService = createDatasourceService(datasource.store)
    const functionalService = createFunctionalService(functional.store)
    const injectProxy = createProxyInjector(proxyService.store, {
      functional: functionalService.resolve,
    })

    // 共享给节点的服务
    const services = {
      prerender: prerenderService.processHook,
      render: renderService.processHook,
      components: componentService.store,
      context,
    }

    createStore(assignObject(services, { injectProxy }))

    ctx.emit('setup', {
      proxy: proxyService.setup,
      prerender: prerenderService.setup,
      render: renderService.setup,
      component: componentService.setup,
      datasource: datasourceService.setup,
      functional: functionalService.setup,
    })
    //#endregion

    //#region 相关监听
    watch(
      () => props.fields,
      (value) => {
        updating.value = true

        root.field = {
          component: props.component,
          children: toRaw(value || []),
        }

        root.scope = {}

        nextTick(() => {
          updating.value = false
        })
      },
      { deep: false, immediate: true }
    )

    watch(
      () => props.modelValue,
      (value) => {
        context.model = toRaw(value || {})
      },
      { deep: false, immediate: false }
    )

    watch(
      () => props.datasource,
      (value, origin) => {
        Object.keys(origin || {})
          .filter((item) => !innerDataNames.includes(item))
          .forEach((key) => {
            delete context[key]
          })

        Object.keys(value || {})
          .filter((item) => !innerDataNames.includes(item))
          .forEach((key) => {
            context[key] = datasourceService.resolve(value[key], {
              injectProxy,
              context,
            })
          })
      },
      { deep: false, immediate: true }
    )
    //#endregion

    //#region listeners 监听
    const watchs = ref([] as any[])

    watch(
      () => props.listeners,
      (value) => {
        watchs.value.forEach((watcher) => watcher())

        if (!value || !isArray(value)) {
          return
        }

        watchs.value = value.map((item) => {
          const injected = injectProxy(item, context)

          const watcher = isFunction(injected.watch)
            ? injected.watch
            : () => injected.watch

          return watch(
            watcher,
            () => {
              injected.actions.forEach((act: any) => {
                if (act.condition === undefined || !!act.condition) {
                  if (act.timeout) {
                    setTimeout(() => act.handler(), act.timeout)
                  } else {
                    act.handler()
                  }
                }
              })
            },
            {
              deep: injected.deep,
              immediate: injected.immediate,
            }
          )
        })
      },
      { deep: false, immediate: true }
    )

    onBeforeUnmount(() => {
      watchs.value.forEach((watcher) => watcher())
    })
    //#endregion

    return () =>
      !updating.value ? h(resolveComponent(JNode.name), root) : null
  },
})
