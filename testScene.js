import { THREE } from './xr.js'

export function setupTestScene({ renderer, scene }) {
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
  const setUpController = index => {
    const onColor = new THREE.Color(0x3333ff)
    const offColor = new THREE.Color(0xffffff)
    
    // The "controller" is the "point" or "business end" of the user's device
    const controller = renderer.xr.getController(index)
    const controllerModel = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.01, 0.05),
      new THREE.MeshLambertMaterial({ color: offColor })
    )
    controller.add(controllerModel)
    scene.add(controller)

    // The "grip" is the location of the user's palm
    const grip = renderer.xr.getControllerGrip(index)
    const gripModel = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.02, 0.02),
      new THREE.MeshLambertMaterial({ color: offColor })
    )
    grip.add(gripModel)
    scene.add(grip)

    // Event handlers
    controller.addEventListener('selectstart', e => {
      controllerModel.material.color = onColor
    })
    controller.addEventListener('selectend', e => {
      controllerModel.material.color = offColor
    })
    controller.addEventListener('squeezestart', e => {
      gripModel.material.color = onColor
    })
    controller.addEventListener('squeezeend', e => {
      gripModel.material.color = offColor
    })
  }
  setUpController(0)
  setUpController(1)
}
