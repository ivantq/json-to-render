import { resolveComponent, defineComponent, h } from 'vue'
import render from '../utils/render'
import { createHook } from '../hook'
import slotHook from '../hook/slot'

export default defineComponent({
  name: 'vJnode',
  props: {
    field: { type: Object, required: true }
  },
  setup: props => {
    createHook([slotHook])(props.field)

    return () =>
      props.field.component
        ? h(
            resolveComponent(props.field.component),
            props.field.props,
            render(props.field.children)
          )
        : null
  }
})
