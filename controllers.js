import {
  fetchProfile,
  MotionController
} from 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/motion-controllers@1.0/dist/motion-controllers.module.min.js'
import { GLTFLoader, THREE } from './xr.js'

export function setupControllers({
  addMotionControllerToScene,
  registerAnimationFrameCallback,
  renderer,
  scene,
  setDebugText
}) {
  const motionControllers = []

  renderer.xr.addEventListener('sessionstart', () => {
    renderer.xr.getSession().addEventListener('inputsourceschange', () => {
      renderer.xr
        .getSession()
        .inputSources.forEach(async (xrInputSource, i) => {
          if (!motionControllers[i]) {
            // Fetch the profile for this controller
            const { profile, assetPath } = await fetchProfile(
              xrInputSource,
              'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles'
            )

            // Create a new MotionController object
            const motionController = new MotionController(
              xrInputSource,
              profile,
              assetPath
            )
            motionControllers[i] = motionController

            // Update the controller's state on every frame
            registerAnimationFrameCallback(() => {
              motionController.updateFromGamepad()
            })

            // Load the controller model and add it to the scene
            const loader = new GLTFLoader()
            loader.load(assetPath, gltf => {
              const grip = renderer.xr.getControllerGrip(i)
              grip.add(gltf.scene)
              scene.add(grip)
              addMotionControllerToScene?.(motionController)
            })
          }
        })
    })
  })
  return

  // See https://immersive-web.github.io/webxr-input-profiles/packages/motion-controllers/
  renderer.xr.addEventListener('sessionstart', () => {
    renderer.xr.getSession().addEventListener('inputsourceschange', event => {
      event.added.forEach(async xrInputSource => {
        const { profile, assetPath } = await fetchProfile(
          xrInputSource,
          'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles'
        )
        log(profile)
        const motionController = new MotionController(
          xrInputSource,
          profile,
          assetPath
        )

        // Load the controller model
        log('Loading ' + assetPath)
        const loader = new GLTFLoader()
        loader.load(assetPath, gltf => {
          log('controller loaded')
          renderer.xr.getController()
          scene.add(gltf.scene)
        })

        // Update on every frame
        registerAnimationFrameCallback(() =>
          motionController.updateFromGamepad()
        )

        addMotionControllerToScene?.(motionController)
      })
    })
  })

  return

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
