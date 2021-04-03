import { THREE } from './xr.js'

export function setupTestScene({ renderer, scene, setupControllers, registerAnimationFrameCallback, setDebugText }) {
  // Add a cube
  const size = 0.4
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshLambertMaterial({ color: 0x3030ff })
  )
  box.position.y = size * 0.5
  box.position.z = -2
  box.rotation.y = 0.2 * Math.PI
  scene.add(box)

  // Add lights
  scene.add(new THREE.HemisphereLight(0x606060, 0x404040))
  const dirLight = new THREE.DirectionalLight(0xffffff)
  dirLight.position.set(1, 1, 1).normalize()
  scene.add(dirLight)

  // Set up VR controllers
  setupControllers({
    addMotionControllerToScene: motionController => {
      // motionController.xrInputSource is an XRInputSource object.
      // See https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource
      //
      // motionController.components contains the current state of controller buttons, thumbsticks, etc.
      // See https://github.com/immersive-web/webxr-input-profiles/tree/main/packages/motion-controllers#components
      //
      log(motionController)
      if(motionController.xrInputSource.handedness === 'right') {
        registerAnimationFrameCallback(() => {
          setDebugText(JSON.stringify(motionController.components, null, 2))
        })
      }
    }
  })
}
