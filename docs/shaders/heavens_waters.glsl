#define uResolution iResolution.xy
#define uTime iTime
#define uMouse (vec2(iMouse.x, iResolution.y - iMouse.y) / iResolution.xy * vec2(640.0, 360.0))

const vec2 clickPos[8] = vec2[8](vec2(0.0),vec2(0.0),vec2(0.0),vec2(0.0),vec2(0.0),vec2(0.0),vec2(0.0),vec2(0.0));
const float clickAge[8] = float[8](1e6,1e6,1e6,1e6,1e6,1e6,1e6,1e6);
#define time uTime
const float noiseScale = 5.0;
#define screenSize vec2(640.0, 360.0)
#define sampleOffset vec2(0.0)
#define renderSize vec2(640.0, 360.0)
const float cellSize = 1.0;
const float octaves = 1.0;
const float gain = 0.9;

#define morphPhase (uTime*0.02)
#define scrollSpeed vec2(0.08, 0.08)
const vec2 loopD = vec2(0.0, 0.0);
const float loopZ = 0.0;
#define mousePos uMouse
const float hoverEnable = 1.0;
const float hoverTarget = 1.0;
const float hoverStrength = 0.5;
const float hoverRadius = 130.0;
const float hoverFalloff = 1.5;
const float hoverScatter = 0.0;
const float hoverDragOnly = 0.0;
const vec2 dragVec = vec2(0.0);
const float dragActive = 0.0;
const float clickEnable = 0.0;
const float clickTarget = 0.0;
const float clickStrength = 0.5;
const float clickRadius = 80.0;
const float clickDecay = 1.0;
const float clickFalloff = 0.5;
const float pinchStrength = -0.7;
#define warpPhase (uTime*0.0)
const float rotate = 45.0;

const vec4 PALETTE[110] = vec4[110](
  vec4(0.632346,0.751967,0.951334,1.0),
  vec4(0.634494,0.754114,0.953482,1.0),
  vec4(0.636642,0.756262,0.955629,1.0),
  vec4(0.63879,0.75841,0.957777,1.0),
  vec4(0.640938,0.760558,0.959925,1.0),
  vec4(0.643085,0.762706,0.962073,1.0),
  vec4(0.645233,0.764853,0.964221,1.0),
  vec4(0.647381,0.767001,0.966368,1.0),
  vec4(0.649529,0.769149,0.968516,1.0),
  vec4(0.651677,0.771297,0.970664,1.0),
  vec4(0.653824,0.773445,0.972812,1.0),
  vec4(0.655972,0.775592,0.974959,1.0),
  vec4(0.65812,0.77774,0.977107,1.0),
  vec4(0.660268,0.779888,0.979255,1.0),
  vec4(0.662416,0.782036,0.981403,1.0),
  vec4(0.664563,0.784184,0.983551,1.0),
  vec4(0.666711,0.786331,0.985698,1.0),
  vec4(0.668859,0.788479,0.987846,1.0),
  vec4(0.671007,0.790627,0.989994,1.0),
  vec4(0.673154,0.792775,0.992142,1.0),
  vec4(0.675302,0.794923,0.99429,1.0),
  vec4(0.67745,0.79707,0.996437,1.0),
  vec4(0.679598,0.799218,0.998585,1.0),
  vec4(0.681746,0.801366,1.0,1.0),
  vec4(0.683893,0.803514,1.0,1.0),
  vec4(0.686041,0.805661,1.0,1.0),
  vec4(0.688189,0.807809,1.0,1.0),
  vec4(0.690337,0.809957,1.0,1.0),
  vec4(0.692485,0.812105,1.0,1.0),
  vec4(0.694632,0.814253,1.0,1.0),
  vec4(0.69678,0.8164,1.0,1.0),
  vec4(0.698928,0.818548,1.0,1.0),
  vec4(0.701076,0.820696,1.0,1.0),
  vec4(0.703224,0.822844,1.0,1.0),
  vec4(0.705371,0.824992,1.0,1.0),
  vec4(0.707519,0.827139,1.0,1.0),
  vec4(0.709667,0.829287,1.0,1.0),
  vec4(0.711815,0.831435,1.0,1.0),
  vec4(0.713963,0.833583,1.0,1.0),
  vec4(0.71611,0.835731,1.0,1.0),
  vec4(0.718258,0.837878,1.0,1.0),
  vec4(0.720406,0.840026,1.0,1.0),
  vec4(0.722554,0.842174,1.0,1.0),
  vec4(0.724701,0.844322,1.0,1.0),
  vec4(0.726849,0.84647,1.0,1.0),
  vec4(0.728997,0.848617,1.0,1.0),
  vec4(0.731145,0.850765,1.0,1.0),
  vec4(0.733293,0.852913,1.0,1.0),
  vec4(0.73544,0.855061,1.0,1.0),
  vec4(0.737588,0.857208,1.0,1.0),
  vec4(0.739736,0.859356,1.0,1.0),
  vec4(0.741884,0.861504,1.0,1.0),
  vec4(0.744032,0.863652,1.0,1.0),
  vec4(0.746179,0.8658,1.0,1.0),
  vec4(0.748327,0.867947,1.0,1.0),
  vec4(0.750475,0.870095,1.0,1.0),
  vec4(0.752623,0.872243,1.0,1.0),
  vec4(0.754771,0.874391,1.0,1.0),
  vec4(0.756918,0.876539,1.0,1.0),
  vec4(0.759066,0.878686,1.0,1.0),
  vec4(0.761214,0.880834,1.0,1.0),
  vec4(0.763362,0.882982,1.0,1.0),
  vec4(0.765509,0.88513,1.0,1.0),
  vec4(0.767657,0.887278,1.0,1.0),
  vec4(0.769805,0.889425,1.0,1.0),
  vec4(0.771953,0.891573,1.0,1.0),
  vec4(0.774101,0.893721,1.0,1.0),
  vec4(0.776248,0.895869,1.0,1.0),
  vec4(0.778396,0.898016,1.0,1.0),
  vec4(0.780544,0.900164,1.0,1.0),
  vec4(0.782692,0.902312,1.0,1.0),
  vec4(0.78484,0.90446,1.0,1.0),
  vec4(0.786987,0.906608,1.0,1.0),
  vec4(0.789135,0.908755,1.0,1.0),
  vec4(0.791283,0.910903,1.0,1.0),
  vec4(0.793431,0.913051,1.0,1.0),
  vec4(0.795579,0.915199,1.0,1.0),
  vec4(0.797726,0.917347,1.0,1.0),
  vec4(0.799874,0.919494,1.0,1.0),
  vec4(0.802022,0.921642,1.0,1.0),
  vec4(0.80417,0.92379,1.0,1.0),
  vec4(0.806318,0.925938,1.0,1.0),
  vec4(0.808465,0.928086,1.0,1.0),
  vec4(0.810613,0.930233,1.0,1.0),
  vec4(0.812761,0.932381,1.0,1.0),
  vec4(0.814909,0.934529,1.0,1.0),
  vec4(0.817056,0.936677,1.0,1.0),
  vec4(0.819204,0.938825,1.0,1.0),
  vec4(0.821352,0.940972,1.0,1.0),
  vec4(0.8235,0.94312,1.0,1.0),
  vec4(0.825648,0.945268,1.0,1.0),
  vec4(0.827795,0.947416,1.0,1.0),
  vec4(0.829943,0.949563,1.0,1.0),
  vec4(0.832091,0.951711,1.0,1.0),
  vec4(0.834239,0.953859,1.0,1.0),
  vec4(0.836387,0.956007,1.0,1.0),
  vec4(0.838534,0.958155,1.0,1.0),
  vec4(0.840682,0.960302,1.0,1.0),
  vec4(0.84283,0.96245,1.0,1.0),
  vec4(0.844978,0.964598,1.0,1.0),
  vec4(0.847126,0.966746,1.0,1.0),
  vec4(0.849273,0.968894,1.0,1.0),
  vec4(0.851421,0.971041,1.0,1.0),
  vec4(0.853569,0.973189,1.0,1.0),
  vec4(0.853797,0.973418,1.0,1.0),
  vec4(0.853797,0.973418,1.0,1.0),
  vec4(0.853797,0.973418,1.0,1.0),
  vec4(0.853797,0.973418,1.0,1.0),
  vec4(0.853797,0.973418,1.0,1.0),
  vec4(0.853797,0.973418,1.0,1.0)
);
vec4 paletteLookup(float x){
  int i = clamp(int(clamp(x,0.0,1.0)*256.0),0,255);
  return PALETTE[clamp(int(float(i)/255.0*110.0),0,109)];
}

#define TAU 6.28318530718
#define MAX_OCTAVES 10
#define MORPH_DESYNC_AMP   1.6
#define MORPH_DESYNC_SCALE 2.5

#define MAX_CLICKS 8

#define MORPH_AMT   2.0
#define ZOOM_AMT    1.0
#define REPEL_AMT   0.3
#define SCATTER_FREQ 60.0

vec2 frameC(vec2 uv) {
    vec2 r = renderSize;
    return (uv - 0.5) * screenSize / r.y;
}
vec2 frameUV(vec2 c) {
    vec2 r = renderSize;
    return 0.5 + c * r.y / screenSize;
}

float hash3(vec3 p) {
    p = fract(p * vec3(127.1, 311.7, 74.7));
    p += dot(p, p.yxz + 19.19);
    return fract((p.x + p.y) * p.z);
}

float vnoise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), u.x),
            mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), u.x), u.y),
        mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), u.x),
            mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), u.x), u.y),
        u.z
    );
}

float basisSample(vec3 p, vec2 d, float pz) {

    return vnoise3(p) * 2.0 - 1.0;
}

float fbm3(vec3 p) {
    float v = 0.0, a = 0.5, norm = 0.0;
    vec2  d  = loopD;
    float pz = loopZ;
    int oct = int(octaves + 0.5);
    for (int i = 0; i < MAX_OCTAVES; i++) {
        if (i >= oct) break;
        float sn = basisSample(p, d, pz);
        float t;
        {
            t = 1.0 - abs(sn);
            t = t * t;
        }
        v    += a * t;
        norm += a;
        p     = p * 2.0 + vec3(5.3, 1.7, 3.1);
        d    *= 2.0;
        pz   *= 2.0;
        a    *= gain;
    }
    return v / norm;
}

#define PINCH_R     0.8
#define PINCH_K     0.9
#define PINCH_PULSE 0.5

float whash2(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * 43.32);
}
float wnoise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(whash2(i + vec2(0.0, 0.0)), whash2(i + vec2(1.0, 0.0)), u.x),
               mix(whash2(i + vec2(0.0, 1.0)), whash2(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec2 warpUV(vec2 uv) {

    vec2  c   = frameC(uv);
    float r   = length(c);
    if (r > 1e-5) {
        float k  = pinchStrength * (1.0 + PINCH_PULSE * sin(warpPhase * TAU));
        float rn = min(r / PINCH_R, 1.0);
        float factor;
        if (k >= 0.0) {
            factor = pow(rn, k * PINCH_K);
        } else {
            factor = 1.0 + (-k) * PINCH_K * (1.0 - rn * rn); 
        }
        c *= factor;
    }
    return frameUV(c);
}

vec2 rotateUV(vec2 uv) {
    
    float ang = rotate * TAU / 360.0;
    float asp = screenSize.x / screenSize.y;
    vec2  c   = (uv - 0.5) * vec2(asp, 1.0);
    float s = sin(ang), co = cos(ang);
    c = mat2(co, -s, s, co) * c;
    return 0.5 + c / vec2(asp, 1.0);
}

float fieldN(vec2 uv, float mzExtra) {
    float mz = morphPhase + mzExtra;

    mz += MORPH_DESYNC_AMP * (wnoise2(uv * MORPH_DESYNC_SCALE) - 0.5);
    
    vec2 nsv = vec2(noiseScale);
    return fbm3(vec3(uv * nsv + time * scrollSpeed, mz));
}

float inflMask(vec2 block, vec2 uv, vec2 center, float radius, float falloff, float scatter) {
    float d     = length(block - center);
    float inner = radius * (1.0 - falloff);
    float m     = 1.0 - smoothstep(inner, max(radius, inner + 0.5), d);
    if (scatter > 0.001) m *= mix(1.0, wnoise2(uv * SCATTER_FREQ), scatter);
    return m;
}

float clickRingMask(vec2 block, vec2 uv) {
    float thick = clickRadius * mix(0.06, 0.5, clickFalloff) + 0.5;
    float acc = 0.0;
    for (int i = 0; i < MAX_CLICKS; i++) {
        float life = clickAge[i] / max(clickDecay, 0.05);
        if (life >= 1.0) continue;
        float d     = length(block - clickPos[i]);
        float ringR = clickRadius * life;
        acc += (1.0 - smoothstep(0.0, thick, abs(d - ringR))) * (1.0 - life);
    }
    
    return acc;
}

void route(float target, float amp, vec2 uv, vec2 centerUV, vec2 smearPx,
           inout float mzAdd, inout float valAdd, inout vec2 uvDisp) {
    if (target < 0.5) {
        valAdd += amp;
    } else if (target < 1.5) {
        mzAdd += amp * MORPH_AMT;
    } else if (target < 2.5) {
        uvDisp += (uv - centerUV) * amp * ZOOM_AMT;
    } else {
        vec2 dir = (length(smearPx) > 1e-4) ? smearPx / screenSize : (uv - centerUV);
        float L = length(dir);

        if (L > 1e-5) uvDisp -= (dir / L) * amp * REPEL_AMT;
    }
}

vec4 shade(vec2 screen_coords) {
    vec2 block = floor((screen_coords + sampleOffset) / cellSize) * cellSize;
    vec2 uv0   = warpUV(block / screenSize);

    float mzAdd = 0.0, valAdd = 0.0;
    vec2  uvDisp = vec2(0.0);
    float hgate  = hoverEnable * ((hoverDragOnly > 0.5) ? dragActive : 1.0);
    vec2  hsmear = (hoverDragOnly > 0.5) ? dragVec : vec2(0.0);
    float mH = hgate * inflMask(block, uv0, mousePos, hoverRadius, hoverFalloff, hoverScatter);
    route(hoverTarget, hoverStrength * mH, uv0, mousePos / screenSize, hsmear,
          mzAdd, valAdd, uvDisp);
    float mC = clickRingMask(block, uv0);
    vec2  clickCenter = clickPos[0];
    float freshest = clickAge[0];
    for (int i = 1; i < MAX_CLICKS; i++) {
        if (clickAge[i] < freshest) { freshest = clickAge[i]; clickCenter = clickPos[i]; }
    }
    route(clickTarget, clickStrength * mC * clickEnable, uv0, clickCenter / screenSize, vec2(0.0),
          mzAdd, valAdd, uvDisp);

    float n = fieldN(rotateUV(uv0 + uvDisp), mzAdd);
    n = clamp(n + valAdd, 0.0, 1.0);
    return paletteLookup(n);
}


void mainImage(out vec4 fragColor, in vec2 fragCoord){
  vec2 uv = fragCoord / iResolution.xy;
  vec4 c = shade(vec2(uv.x, 1.0 - uv.y) * vec2(640.0, 360.0));
  fragColor = vec4(c.rgb * c.a, 1.0);
}