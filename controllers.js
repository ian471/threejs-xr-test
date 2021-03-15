import { THREE } from './xr.js'

export function setupControllers({
  registerAnimationFrameCallback,
  renderer,
  scene,
  setDebugText
}) {
  // Poll controller gamepad buttons
  const BUTTON_NAMES = [
    ['rtrigger', 'rsqueeze', null, 'rthumbstick', 'Abutton', 'Bbutton'],
    ['ltrigger', 'lsqueeze', null, 'lthumbstick', 'Xbutton', 'Ybutton']
  ]
  renderer.xr.addEventListener('sessionstart', e => {
    const session = renderer.xr.getSession()
    const inputSources = session.inputSources
    let prev = {}

    const pollGamepads = () => {
      let debugText = ''

      let b = 0
      inputSources.forEach((src, i) => {
        const controller = renderer.xr.getController(i)
        src.gamepad?.axes.forEach((axis, j) => {
          debugText += `c${i} axis${j} = ${axis}\n`

          // Don't fire change events on deltas under 1%
          const delta = Math.abs(axis - (prev[b] ?? 0))

          if (delta >= 0.01) {
            prev[b] = axis
            controller.dispatchEvent({
              type: 'axischange',
              axisIndex: j,
              axis
            })
          }
          b++
        })
        src.gamepad?.buttons.forEach((button, j) => {
          debugText += `c${i} button${j} = ${button.pressed}\n`
          if (button.pressed !== prev[b]) {
            prev[b] = button.pressed
            const name = BUTTON_NAMES[i][j] ?? 'button'
            controller.dispatchEvent({
              type: `${name}${button.pressed ? 'down' : 'up'}`,
              buttonIndex: j
            })
          }
          b++
        })
      })

      setDebugText?.(debugText)
    }
    const { unregister } = registerAnimationFrameCallback(pollGamepads)
    const stop = () => {
      unregister()
      renderer.xr.removeEventListener('sessionend', stop)
    }
    renderer.xr.addEventListener('sessionend', stop)
  })
}
