import * as THREE from 'three'
import { OrbitControls } from './OrbitControls.js'
import { vertexShader, fragmentShader } from './tether.js'
import { DepthTexture } from 'three'
import { EffectComposer, RenderPass } from 'postprocessing'

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', precision: 'highp' })
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.depthTexture = new DepthTexture();
renderer.depthTexture.format = THREE.RGFormat;
renderer.depthTexture.minFilter = THREE.NearestFilter;
renderer.depthTexture.magFilter = THREE.NearestFilter;
renderer.depthTexture.generateMipmaps = false;
renderer.depthTexture.format = THREE.RGFormat;
renderer.depthTexture.type = THREE.UnsignedIntType;

document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.y = 5
camera.position.z = 5

const controls = new OrbitControls( camera, renderer.domElement );

const composer = new EffectComposer( renderer );
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const clock = new THREE.Clock();
var time = 0.0;
var speed = 0.5; // more similar to the game

let sceneObjects = []

const indices = [
    0, 1, 4,
    4, 3, 0,
    1, 2, 4,
    2, 5, 4
  ];

const vertices = new Float32Array( [
        -0.8, 1, 6,
        -0.17, 1, 6,
        0.46, 1, 6,
        -0.8, 1, -26,
        -0.17, 1, -26,
        0.46, 1, -26,
] );

// 32.0 is taken from the game files, it's the intended height ratio for this texture
// I believe width ratio is around 0.8 but I forgot to check to be sure :D
const heightRatio = 32.0 / (vertices[8] - vertices[11]);

const colors = new Float32Array( [
    2729, 15, 3482, 250,
    2729, 15, 3482, 250,
    2729, 15, 3482, 250,
    2729, 15, 3482, 250,
    2729, 15, 3482, 250,
    2729, 15, 3482, 250,
] );

const tex = new Float32Array( [
    -100, -350 / heightRatio, -50, -1100 / heightRatio,
    100, -350 / heightRatio, 100, -1100 / heightRatio,
    300, -350 / heightRatio, 250, -1100 / heightRatio,
    -100, 550 / heightRatio, -50, 1300 / heightRatio,
    100, 550 / heightRatio, 100, 1300 / heightRatio,
    300, 550 / heightRatio, 250, 1300 / heightRatio,
] );

// unused
const v3 = new Float32Array( [
    13107, 17214, -19661, 17492,
    72, 104, 25700, 100,
    0, 17229, 0, 17473,
    128, 64, 25700, 100,
    -32768, 17286, 0, 17473,
    0, 224, 25700, 100
] );

const distortionStrength = new Float32Array( [
    0.4, 0, 1.0, 0,
    0.4, 0, 1.0, 0,
    0.4, 0, 1.0, 0,
    0.4, 0, 1.0, 0,
    0.4, 0, 1.0, 0,
    0.4, 0, 1.0, 0,
] );

// Geometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setAttribute('c', new THREE.BufferAttribute(colors, 4));
geometry.setAttribute('tex', new THREE.BufferAttribute(tex, 4));
geometry.setAttribute('v3', new THREE.BufferAttribute(v3, 4));
geometry.setAttribute('distStrength', new THREE.BufferAttribute(distortionStrength, 4));
geometry.setIndex(indices);

// Color map
const colorTex = new THREE.TextureLoader().load("./color.png")
colorTex.wrapS = THREE.ClampToEdgeWrapping;
colorTex.wrapT = THREE.RepeatWrapping;
colorTex.anisotropy = 0;
colorTex.magFilter = THREE.NearestFilter;
colorTex.minFilter = THREE.NearestMipmapNearestFilter;

// Distortion map
const distTex = new THREE.TextureLoader().load("./dist.png")
distTex.wrapS = THREE.RepeatWrapping;
distTex.wrapT = THREE.RepeatWrapping;
distTex.anisotropy = 0;
distTex.magFilter = THREE.LinearFilter;
distTex.minFilter = THREE.LinearMipMapLinearFilter;

let uniforms = {
      instanceParams: {type: 'vec4', value: new THREE.Vector4(0, 1, 1, 1)},
      screenSize: {type: 'vec4', value: new THREE.Vector4(window.innerWidth, window.innerHeight, 1, 0.3)},
      modulateColor: {type: 'vec4', value: new THREE.Vector4(1, 1, 1, 1)},
      fogParam: {type: 'vec4', value: new THREE.Vector4(1, 0, 1, 0)},
      cameraParam: {type: 'vec4', value: camera.position},
      toneMapParam: {type: 'vec4', value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0)},

      colorT: {type: 'sampler2D', value: colorTex},
      distortion: {type: 'sampler2D', value: distTex},
      depthT: {type: 'sampler2D', value: renderer.depthTexture}
  }
let material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: uniforms,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    clipping: true,
    transparent: true
})

function addTether() {
    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh)
    sceneObjects.push(mesh);
    return mesh;
}

function animate() {
	controls.update();
  
  if (sceneObjects.length > 0) {
    tether.rotation.z = -Math.atan2(camera.position.x - tether.position.x, camera.position.y - tether.position.y);
    const vArr = geometry.attributes['position'].array;
    const tArr = geometry.attributes['tex'].array;
    time += clock.getDelta();
    var difference = Math.round(-0.5 * Math.sin(time) - 1.5) * speed;
    const x = Math.sin(time * 8.0) / (10000 / speed);
    const y = Math.sin(time * 8.0) / (100000 / speed);
    const z = -Math.sin(time * 8.0) / (20000 / speed);

    geometry.attributes['position'] = new THREE.BufferAttribute(new Float32Array([
    vArr[0] + x, vArr[1] + y, vArr[2] + z,
    vArr[3] + x, vArr[4] + y, vArr[5] + z,
    vArr[6] + x, vArr[7] + y, vArr[8] + z,
    vArr[9] + x, vArr[10] + y, vArr[11] + z,
    vArr[12] + x, vArr[13] + y, vArr[14] + z,
    vArr[15] + x, vArr[16] + y, vArr[17] + z
    ]), 3);
    geometry.attributes['tex'] = new THREE.BufferAttribute(new Float32Array([
    tArr[0], tArr[1] + difference, tArr[2] + 2, tArr[3] + difference,
    tArr[4], tArr[5] + difference, tArr[6] + 2, tArr[7] + difference,
    tArr[8], tArr[9] + difference, tArr[10] + 2, tArr[11] + difference,
    tArr[12], tArr[13] + difference, tArr[14] + 2, tArr[15] + difference,
    tArr[16], tArr[17] + difference, tArr[18] + 2, tArr[19] + difference,
    tArr[20], tArr[21] + difference, tArr[22] + 2, tArr[23] + difference,
    ]), 4);
    geometry.attributes['position'].needsUpdate = true;
    geometry.attributes['tex'].needsUpdate = true;
}
  
  composer.render();
	requestAnimationFrame( animate );
}

const tether = addTether();
animate();