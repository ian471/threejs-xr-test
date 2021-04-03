import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js'
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js'
import { VRButton } from 'https://unpkg.com/three@0.126.1/examples/jsm/webxr/VRButton.js'

import { setupControllers } from './controllers.js'

export { GLTFLoader, THREE }

export function setupXr({ enableDebugPlane = false }) {
  // Set up the scene
  const scene = new THREE.Scene()

  // Create a camera
  // The camera settings only matter for the 2D preview
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight
  )
  camera.position.y = 1.25
  camera.rotation.x = -0.05 * Math.PI

  // Initiaize the renderer with XR
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  renderer.setAnimationLoop(() => {
    animationFrameCallbacks.forEach(func => func())
    renderer.render(scene, camera)
  })

  // Provide a hook to register callbacks that will run on every frame
  const animationFrameCallbacks = new Set()
  const registerAnimationFrameCallback = func => {
    animationFrameCallbacks.add(func)
    return {
      unregister() {
        animationFrameCallbacks.delete(func)
      }
    }
  }

  // Add a plane where debug text can be printed
  const { setDebugText, appendDebugText } = enableDebugPlane
    ? setupDebugPlane({ scene })
    : {}
  window.addEventListener('log', e => {
    let msg = e.detail.toString()
    while (msg) {
      appendDebugText(msg.slice(0, 80) + '\n')
      msg = msg.slice(80)
    }
  })

  // Return a function to call to set up controllers
  const _setupControllers = args =>
    setupControllers({
      registerAnimationFrameCallback,
      renderer,
      scene,
      setDebugText,
      ...args
    })

  // Add the viewport and "Enter VR" button to the page
  document.body.appendChild(renderer.domElement)
  document.body.appendChild(VRButton.createButton(renderer))

  return {
    camera,
    registerAnimationFrameCallback,
    renderer,
    scene,
    setDebugText,
    setupControllers: _setupControllers
  }
}

export function setupDebugPlane({ scene }) {
  // Create a canvas with debug information
  const debugPlaneSize = 2
  const debugPlaneFontSize = 48.0
  const debugCanvas = document.createElement('canvas')
  debugCanvas.width = 1000 * debugPlaneSize
  debugCanvas.height = 1000 * debugPlaneSize
  const debugCanvasContext = debugCanvas.getContext('2d')
  debugCanvasContext.fillStyle = '#fff'
  debugCanvasContext.font = `${debugPlaneFontSize}px sans-serif`
  const debugTexture = new THREE.CanvasTexture(debugCanvas)
  const debugPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(debugPlaneSize, debugPlaneSize),
    new THREE.MeshBasicMaterial({ map: debugTexture })
  )
  debugPlane.position.x = 1
  debugPlane.position.y = debugPlaneSize * 0.5
  debugPlane.position.z = -3
  debugPlane.rotation.y = -0.1 * Math.PI
  scene.add(debugPlane)

  let debugText = ''
  const setDebugText = text => {
    debugText = text
    debugCanvasContext.clearRect(0, 0, debugCanvas.width, debugCanvas.height)
    const lines = text.split('\n')
    for (let r = 0; r < lines.length; ++r) {
      debugCanvasContext.fillText(lines[r], 0, (r + 1) * debugPlaneFontSize)
    }
    debugTexture.needsUpdate = true
  }

  const appendDebugText = text => {
    setDebugText(debugText + text)
  }

  setDebugText('Debug text will appear here.\n')

  return { setDebugText, appendDebugText }
}
