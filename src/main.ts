import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import Mesh from './geometry/Mesh'
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {readTextFile} from './globals';
import {LSystemRoad} from './LSystemRoad';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Show Terrain' : true,
  'Show Population' : true,
  'Land vs. Water' : false,
  'Iterations': 6,
  'Road Length': 50,
  'Highway Length': 400,
  'Snap Coefficient': 0.6,
  'Extension Coefficient': 0.03
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let lsystemRoad: LSystemRoad;
let preIter = 5;
let textureData: Uint8Array;
let preRoadLength = 30;
let rerun = false;
const gui = new DAT.GUI();
// Add controls to the gui
gui.add(controls, 'Show Terrain');
gui.add(controls, 'Show Population');
gui.add(controls, 'Land vs. Water');
gui.add(controls, 'Iterations', 1, 7).step(1).onChange(
    function() {
      rerun = true;
    }.bind(this));
gui.add(controls, 'Road Length', 20, 80).step(1).onChange(
    function() {
      rerun = true;
    }.bind(this));
gui.add(controls, 'Highway Length', 385, 405).step(1).onChange(
    function() {
      rerun = true;
    }.bind(this));

gui.add(controls, 'Snap Coefficient', 0.1, 0.9).step(0.1).onChange(
    function() {
      rerun = true;
    }.bind(this));

gui.add(controls, 'Extension Coefficient', 0.01, 0.09).step(0.01).onChange(
    function() {
      rerun = true;
    }.bind(this));

function generateRoad() {
  // pass texture data to road LSystem
  let highwayLength = controls["Highway Length"];
  let highwayAngle = 10;
  let roadLength = controls['Road Length'];
  let iterations = controls['Iterations'];
  let snap_coefficient = controls["Snap Coefficient"]
  let extension_coefficient = controls["Extension Coefficient"];
  lsystemRoad.run(highwayLength, highwayAngle, roadLength, iterations, snap_coefficient, extension_coefficient);
  // run LSystem
}


function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  // load from obj file
  // load mud
  // let mudDada = readTextFile("https://raw.githubusercontent.com/chloele33/lsystem-tree/master/src/obj/mud.obj");
  // let mudMesh = new Mesh(mudDada, vec3.fromValues(0,0,0));
  // mudMesh.create();
  //
  // let mudColorArray = [220 / 255, 160 / 255, 120/255, 1];
  // let cols = new Float32Array(mudColorArray);


  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  // let offsetsArray = [];
  // let colorsArray = [];
  //
  // let n: number = 100.0;
  // for(let i = 0; i < n; i++) {
  //   for(let j = 0; j < n; j++) {
  //     offsetsArray.push(i);
  //     offsetsArray.push(j);
  //     offsetsArray.push(0);
  //
  //     colorsArray.push(i / n);
  //     colorsArray.push(j / n);
  //     colorsArray.push(1.0);
  //     colorsArray.push(1.0); // Alpha channel
  //   }
  // }
  // let offsets: Float32Array = new Float32Array(offsetsArray);
  // let colors: Float32Array = new Float32Array(colorsArray);
  // square.setInstanceVBOs(offsets, colors);
  // square.setNumInstances(n * n); // grid of "particles"
}

// function loadLSystemScene(lsystemRoad: LSystemRoad) {
//
// }

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);



  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST)
 // gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/texture-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/texture-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    //gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    //renderer.clear();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, 2000, 2000);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (controls["Show Terrain"] == true) {
      textureShader.setTerrain(1.0);
    } else {
      textureShader.setTerrain(0.0);
    }

    if (controls["Show Population"] == true) {
      textureShader.setPopulation(1.0);
    } else {
      textureShader.setPopulation(0.0);
    }

    if (controls["Land vs. Water"] == true) {
      textureShader.setLandVsWater(1.0);
    } else {
      textureShader.setLandVsWater(0.0);
    }

    if (rerun) {
      rerun = false;
      main();
    }


    renderer.render(camera, textureShader, [screenQuad]);
    //renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  // -------------------for texture renderer --------------------
  var tex_frameBuffer = gl.createFramebuffer();
  var tex_renderBuffer = gl.createRenderbuffer();
  var texture = gl.createTexture();
  var width = window.innerWidth;
  var height = window.innerHeight;
  width = 2000;
  height = 2000;
  // bind texture
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  // set texture's render settings
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // bind frame buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, tex_frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  // bind render buffer
  gl.bindRenderbuffer(gl.RENDERBUFFER, tex_renderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, tex_renderBuffer);

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  // render to frame buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, tex_frameBuffer);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Render on the whole framebuffer, complete from the lower left corner to the upper right
  gl.viewport(0, 0, 2000, 2000);
  // clear screen
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderer.render(camera, flat, [screenQuad]);

  // save texture date
  gl.bindFramebuffer(gl.FRAMEBUFFER, tex_frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  var texturePixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, texturePixels);
  textureData = texturePixels;

  // pass texture data to road LSystem
  // let highwayLength = 400;
  // let highwayAngle = 10;
  // let roadLength = 30;
  // let iterations = controls['Iterations'];
  // lsystemRoad = new LSystemRoad(texturePixels, width, height, highwayLength, highwayAngle, roadLength, iterations);
  // // run LSystem

  lsystemRoad = new LSystemRoad(textureData, 2000, 2000);
  generateRoad();

  // instance render road system
  let vboData = lsystemRoad.getVBO();
  square.setInstanceVBOs2(vboData.col1, vboData.col2, vboData.col3, vboData.col4, vboData.colors);
  square.setNumInstances(vboData.col1.length / 4.0);


  //------------------------------------------------------------------

  window.addEventListener('resize', function() {
    renderer.setSize(2000, 2000);
    camera.setAspectRatio(2000/2000);
    camera.updateProjectionMatrix();
    flat.setDimensions(2000, 2000);
  }, false);

  renderer.setSize(2000, 2000);
  camera.setAspectRatio(2000 / 2000);
  camera.updateProjectionMatrix();
  flat.setDimensions(2000, 2000);
  instancedShader.setDimensions(2000,  2000);

  // Start the render loop
  tick();
}

main();
