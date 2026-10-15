import { defineProperties } from "figma:shaders"

export default function Effect() {}

export function setup(device, frame) {
  frame.state.shaderModule = device.createShaderModule({ code: `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  motion: vec4f,
  blue: vec4f,
  pink: vec4f,
  orange: vec4f,
  background: vec4f,
}
@group(0) @binding(0) var<uniform> u: Uniforms;
struct Vin { @location(0) pos: vec2f, @location(1) uv: vec2f }
struct Vout { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn vs_main(v: Vin) -> Vout {
  var o: Vout; o.position = vec4f(v.pos,0.0,1.0); o.uv = v.uv; return o;
}
fn gaussian(x: f32, width: f32) -> f32 {
  return exp(-0.5*x*x/max(width*width,0.001));
}
@fragment fn fs_main(v: Vout) -> @location(0) vec4f {
  // Reference-space distances fit the entire surface, not an internal shape.
  // The wash and horizontal ribbons intentionally follow target proportions.
  let p = (v.uv-vec2f(0.5))*vec2f(440.0,52.0);
  let prog = u.motion.x;
  let ignition = smoothstep(0.07,0.18,prog)*(1.0-smoothstep(0.76,0.96,prog));
  let travel = smoothstep(0.19,0.64,prog);
  let flareX = mix(440.0*0.48,-440.0*0.45,travel);
  let gx = p.x-flareX;
  let soft = u.motion.w;
  let glowWidth = max(u.motion.y,8.0);
  let band = gaussian(gx,glowWidth);
  let wake = smoothstep(flareX-glowWidth,flareX+glowWidth,p.x);
  let wash = (band*0.5+wake*0.60)*ignition;
  let ribbon = gaussian(abs(p.y)-26.0,2.0+soft*2.2)*band*ignition;
  let warm = smoothstep(0.53,0.63,prog)*(1.0-smoothstep(0.67,0.79,prog));
  let cool = u.blue.rgb*u.blue.a;
  let rose = u.pink.rgb*u.pink.a;
  let amber = u.orange.rgb*u.orange.a;
  var glow = cool*(0.045+wash*0.63);
  glow += cool*gaussian(p.y,16.0)*wake*ignition*0.15;
  glow += cool*ribbon*1.15;
  let crest = gaussian(p.y+26.0,4.5+soft*2.0)*band;
  glow += rose*crest*ignition*1.10;
  let front = gaussian(gx,11.0+soft*6.0)*ignition;
  glow += mix(rose,amber,warm)*front*(0.25+0.75*warm);
  glow = clamp(glow*u.motion.z,vec3f(0.0),vec3f(1.0));
  // Composite in premultiplied space, then return straight alpha for a fill.
  // Transparent background retains independently visible luminous regions.
  let glowAlpha = max(glow.r,max(glow.g,glow.b));
  let bgAlpha = clamp(u.background.a,0.0,1.0);
  let alpha = glowAlpha+bgAlpha*(1.0-glowAlpha);
  let composite = glow+u.background.rgb*bgAlpha*(1.0-glowAlpha);
  return vec4f(composite/max(alpha,0.00001),alpha);
}
` });
  frame.state.quad = device.createBuffer({size:96,usage:GPUBufferUsage.VERTEX,mappedAtCreation:true});
  new Float32Array(frame.state.quad.getMappedRange()).set([-1,-1,0,1,1,-1,1,1,-1,1,0,0,-1,1,0,0,1,-1,1,1,1,1,1,0]);
  frame.state.quad.unmap();
  frame.state.uniformBuf = device.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
}

export function render(device, frame) {
  var p = frame.params;
  var progress = Math.max(0,Math.min(1,p.progress));
  if (p.playback) {
    var elapsed = Math.max(0,frame.time*0.001);
    var duration = Math.max(0.2,p.duration);
    var cycle = duration+Math.max(0,p.pause);
    var t = p.loop ? elapsed%cycle : Math.min(elapsed,cycle);
    progress = Math.min(t/duration,1);
  }
  if (p.reverse) progress = 1-progress;
  var blue = p.blue;
  var pink = p.pink;
  var orange = p.orange;
  var bg = p.background;
  device.queue.writeBuffer(frame.state.uniformBuf,0,new Float32Array([
    progress,p.glowWidth,p.intensity,p.softness,
    blue.r,blue.g,blue.b,blue.a,
    pink.r,pink.g,pink.b,pink.a,
    orange.r,orange.g,orange.b,orange.a,
    bg.r,bg.g,bg.b,bg.a
  ]));
  if (frame.state.pipelineFormat !== frame.output.format) {
    frame.state.pipeline = device.createRenderPipeline({
      layout:"auto",
      vertex:{module:frame.state.shaderModule,entryPoint:"vs_main",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,format:"float32x2",offset:0},{shaderLocation:1,format:"float32x2",offset:8}]}]},
      fragment:{module:frame.state.shaderModule,entryPoint:"fs_main",targets:[{format:frame.output.format}]},
      primitive:{topology:"triangle-list"}
    });
    frame.state.pipelineFormat=frame.output.format;
  }
  var bindGroup = device.createBindGroup({layout:frame.state.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame.state.uniformBuf}}]});
  var encoder = device.createCommandEncoder();
  var pass = encoder.beginRenderPass({colorAttachments:[{view:frame.output.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});
  pass.setPipeline(frame.state.pipeline);
  pass.setBindGroup(0,bindGroup);
  pass.setVertexBuffer(0,frame.state.quad);
  pass.draw(6);
  pass.end();
  device.queue.submit([encoder.finish()]);
}

defineProperties(Effect, {
  playback:{type:"boolean",label:"Play animation",defaultValue:true},
  progress:{type:"number",label:"Progress (when paused)",defaultValue:0,control:"slider",min:0,max:1,step:0.001},
  duration:{type:"number",label:"Cycle duration",defaultValue:4.5,control:"slider",min:0.5,max:20,step:0.1,unit:"s"},
  pause:{type:"number",label:"Pause between cycles",defaultValue:1,control:"slider",min:0,max:10,step:0.1,unit:"s"},
  loop:{type:"boolean",label:"Loop",defaultValue:true},
  reverse:{type:"boolean",label:"Reverse",defaultValue:false},
  glowWidth:{type:"number",label:"Glow width",defaultValue:68,control:"slider",min:8,max:220,step:1},
  intensity:{type:"number",label:"Glow intensity",defaultValue:1.15,control:"slider",min:0,max:3,step:0.01},
  softness:{type:"number",label:"Glow softness",defaultValue:0.7,control:"slider",min:0,max:2,step:0.01},
  blue:{type:"color",label:"Blue",defaultValue:{r:0.15,g:0.25,b:1,a:1}},
  pink:{type:"color",label:"Pink",defaultValue:{r:1,g:0.20,b:0.76,a:1}},
  orange:{type:"color",label:"Orange",defaultValue:{r:1,g:0.32,b:0.02,a:1}},
  background:{type:"color",label:"Background",defaultValue:{r:0.125,g:0.135,b:0.14,a:1}}
});
