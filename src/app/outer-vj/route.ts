const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OUTER ASCII DITHER</title>
  <style>
    :root{
      --bg:#000;
      --panel:#0a0a0a;
      --panel2:#111;
      --border:#252525;
      --text:#ededed;
      --muted:#888;
      --accent:#63ff00;
    }
    *{box-sizing:border-box}
    html,body{margin:0;width:100%;height:100%;background:#000;color:var(--text);overflow:hidden}
    body{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
    button,select,input{font:inherit}
    #app{display:grid;grid-template-columns:minmax(0,1fr) 320px;width:100%;height:100%}
    #app.ui-hidden{grid-template-columns:1fr}
    #stage{position:relative;min-width:0;height:100%;background:#000;overflow:hidden}
    #cv{display:block;width:100%;height:100%;background:#000}
    #hud{
      position:absolute;left:14px;top:12px;z-index:3;
      font-size:11px;letter-spacing:.12em;text-transform:uppercase;
      color:#ddd;text-shadow:0 1px 3px #000;pointer-events:none
    }
    #hint{
      position:absolute;left:14px;bottom:12px;z-index:3;
      font-size:10px;letter-spacing:.08em;text-transform:uppercase;
      color:#888;text-shadow:0 1px 3px #000;pointer-events:none
    }
    #topbar{position:absolute;right:12px;top:12px;z-index:4;display:flex;gap:7px}
    .topbtn{
      border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.62);color:#fff;
      padding:8px 12px;cursor:pointer;text-transform:uppercase;letter-spacing:.08em;font-size:10px
    }
    .topbtn:hover{border-color:var(--accent)}
    #sidebar{
      height:100%;overflow:auto;background:var(--panel);border-left:1px solid var(--border);
      padding:14px
    }
    #app.ui-hidden #sidebar{display:none}
    .brand{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
    .brand strong{font-size:14px;letter-spacing:.14em}
    .brand span{font-size:9px;color:var(--muted);letter-spacing:.1em}
    .group{
      display:grid;gap:7px;padding:12px 0;border-top:1px solid var(--border)
    }
    .group:first-of-type{border-top:0;padding-top:0}
    .section{
      font-size:9px;letter-spacing:.16em;font-weight:700;text-transform:uppercase;color:#ddd;margin-bottom:2px
    }
    label{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
    select,input[type=text]{
      width:100%;min-height:36px;background:#0d0d0d;color:var(--text);
      border:1px solid var(--border);padding:7px 9px;outline:none
    }
    select:focus,input:focus,button:focus{border-color:var(--accent);outline:none}
    input[type=range]{width:100%;accent-color:var(--accent)}
    .row{display:grid;grid-template-columns:1fr 46px;align-items:center;gap:8px}
    .val{font-size:10px;color:var(--muted);text-align:right}
    .check{display:flex;gap:8px;align-items:center;color:var(--muted);font-size:11px}
    .check input{accent-color:var(--accent)}
    .buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .buttons button{
      min-height:36px;border:1px solid var(--border);background:#101010;color:#ddd;
      cursor:pointer;text-transform:uppercase;font-size:10px;letter-spacing:.06em
    }
    .buttons button:hover{border-color:var(--accent)}
    .motion{background:#0d0d0d;border:1px solid var(--border);padding:10px}
    .swatches{display:grid;grid-template-columns:repeat(5,1fr);height:20px;border:1px solid var(--border);overflow:hidden}
    .swatches span{display:block}
    .kbd{color:var(--accent)}
    @media (max-width: 980px){
      #app{grid-template-columns:minmax(0,1fr) 280px}
    }
  </style>
</head>
<body>
<div id="app">
  <main id="stage">
    <canvas id="cv"></canvas>
    <div id="hud">BLOCK PLASMA / OUTER</div>
    <div id="hint"><span class="kbd">F</span> fullscreen · <span class="kbd">H</span> UI · <span class="kbd">SPACE</span> pause · <span class="kbd">R</span> random</div>
    <div id="topbar">
      <button class="topbtn" id="fullscreenBtn" type="button">Fullscreen</button>
      <button class="topbtn" id="hideBtn" type="button">Hide UI</button>
    </div>
  </main>

  <aside id="sidebar">
    <div class="brand"><strong>OUTER ASCII DITHER</strong><span>DESKTOP</span></div>

    <section class="group">
      <div class="section">Generator</div>
      <label>Preset</label>
      <select id="preset">
        <option value="blockplasma">Block Plasma</option>
        <option value="roto">Rotozoom</option>
        <option value="tunnel">Tunnel</option>
        <option value="checker">Checker Warp</option>
        <option value="raster">Raster Melt</option>
        <option value="moire">Moire Dither</option>
        <option value="worm">Worm Surface</option>
        <option value="crush">1-Bit Crush</option>
        <option value="starburst">Starburst</option>
        <option value="wavefold">Wave Fold</option>
        <option value="polar">Polar Mesh</option>
        <option value="cells">Pulse Cells</option>
        <option value="zebra">Zebra Melt</option>
        <option value="diamonds">Diamond Warp</option>
        <option value="crosshatch">Crosshatch</option>
        <option value="storm">Pixel Storm</option>
        <option value="vertical">Vertical Melt</option>
        <option value="interference">Interference</option>
      </select>

      <label>Dither</label>
      <select id="dither">
        <option value="bayer4">Bayer 4×4</option>
        <option value="bayer8">Bayer 8×8</option>
        <option value="bayer2">Bayer 2×2</option>
        <option value="noise">Noise</option>
        <option value="threshold">1-Bit</option>
        <option value="none">None</option>
      </select>
    </section>

    <section class="group">
      <div class="section">Color</div>
      <label>Palette</label>
      <select id="palette">
        <option value="outer">OUTER</option>
        <option value="eva">EVA-01 Acid</option>
        <option value="matrix">Toxic Terminal</option>
        <option value="ultraviolet">Ultraviolet Heat</option>
        <option value="cyber">Cyber Ice</option>
        <option value="infrared">Infrared CRT</option>
        <option value="sunset">Acid Sunset</option>
      </select>
      <div id="swatches" class="swatches"></div>

      <label>Color Spread</label>
      <div class="row"><input id="colorSpread" type="range" min="20" max="180" value="100"><span id="colorSpreadV" class="val">1.00</span></div>
    </section>

    <section class="group motion">
      <div class="section">Continuous Motion</div>

      <label>Auto Zoom</label>
      <div class="row"><input id="autoZoom" type="range" min="0" max="80" value="18"><span id="autoZoomV" class="val">18</span></div>

      <label>Zoom Rate</label>
      <div class="row"><input id="zoomRate" type="range" min="-200" max="200" value="45"><span id="zoomRateV" class="val">0.45</span></div>

      <label>Move X</label>
      <div class="row"><input id="moveX" type="range" min="-100" max="100" value="12"><span id="moveXV" class="val">0.12</span></div>

      <label>Move Y</label>
      <div class="row"><input id="moveY" type="range" min="-100" max="100" value="-5"><span id="moveYV" class="val">-0.05</span></div>

      <label>Rotation</label>
      <div class="row"><input id="rotation" type="range" min="-150" max="150" value="16"><span id="rotationV" class="val">0.16</span></div>

      <div class="buttons">
        <button id="motionOff" type="button">Motion Off</button>
        <button id="motionRandom" type="button">Random Motion</button>
      </div>
    </section>

    <section class="group">
      <div class="section">ASCII</div>
      <label>Character Set</label>
      <select id="charset">
        <option value="blocks">█▓▒░ </option>
        <option value="blocks2">██▓▒░· </option>
        <option value="ascii">@%#*+=-:. </option>
        <option value="dots">●•· </option>
        <option value="thin">#*+:· </option>
        <option value="custom">Custom</option>
      </select>
      <input id="custom" type="text" value="█▓▒░ " maxlength="32">
    </section>

    <section class="group">
      <div class="section">Dither Detail</div>

      <label>Density</label>
      <div class="row"><input id="density" type="range" min="44" max="200" value="116"><span id="densityV" class="val">116</span></div>

      <label>Contrast</label>
      <div class="row"><input id="contrast" type="range" min="50" max="300" value="210"><span id="contrastV" class="val">2.10</span></div>

      <label>Threshold</label>
      <div class="row"><input id="threshold" type="range" min="-70" max="70" value="0"><span id="thresholdV" class="val">0</span></div>

      <label>Dither Amount</label>
      <div class="row"><input id="ditherAmt" type="range" min="0" max="100" value="72"><span id="ditherAmtV" class="val">72</span></div>
    </section>

    <section class="group">
      <div class="section">Surface</div>

      <label>Warp</label>
      <div class="row"><input id="warp" type="range" min="0" max="100" value="50"><span id="warpV" class="val">50</span></div>

      <label>Wave</label>
      <div class="row"><input id="wave" type="range" min="0" max="100" value="65"><span id="waveV" class="val">65</span></div>

      <label>Twist</label>
      <div class="row"><input id="twist" type="range" min="-100" max="100" value="20"><span id="twistV" class="val">20</span></div>

      <label>Base Zoom</label>
      <div class="row"><input id="zoom" type="range" min="40" max="220" value="100"><span id="zoomV" class="val">1.00</span></div>

      <label>Animation Speed</label>
      <div class="row"><input id="speed" type="range" min="0" max="220" value="86"><span id="speedV" class="val">0.86</span></div>
    </section>

    <section class="group">
      <div class="section">Output</div>
      <label class="check"><input id="invert" type="checkbox"> Invert</label>
      <label class="check"><input id="scan" type="checkbox" checked> Scanlines</label>
      <label class="check"><input id="poster" type="checkbox"> Hard Posterize</label>

      <div class="buttons">
        <button id="random" type="button">Random</button>
        <button id="pause" type="button">Pause</button>
      </div>
    </section>
  </aside>
</div>

<script>
(() => {
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const c = $('#cv');
  const ctx = c.getContext('2d', {alpha:false});

  const ids = [
    'preset','dither','palette','swatches','colorSpread',
    'autoZoom','zoomRate','moveX','moveY','rotation',
    'motionOff','motionRandom','charset','custom',
    'density','contrast','threshold','ditherAmt',
    'warp','wave','twist','zoom','speed',
    'invert','scan','poster','random','pause',
    'fullscreenBtn','hideBtn','hud'
  ];
  const e = {};
  ids.forEach(id => e[id] = $('#'+id));

  const sets = {
    blocks:'█▓▒░ ',
    blocks2:'██▓▒░· ',
    ascii:'@%#*+=-:. ',
    dots:'●•· ',
    thin:'#*+:· '
  };

  const palettes = {
    outer:['#000000','#071006','#17330d','#63ff00','#b6ff3b'],
    eva:['#050008','#31105c','#6f24a8','#78ff00','#d8ff29'],
    matrix:['#001106','#003c12','#00a83a','#70ff57','#e6ffb3'],
    ultraviolet:['#080013','#3b0066','#8700ff','#ff218c','#ffdc54'],
    cyber:['#020715','#062b59','#00a8ff','#21ffe7','#f4ffff'],
    infrared:['#090000','#4c0000','#d51616','#ff6b00','#ffe7a1'],
    sunset:['#16001f','#610061','#ff2a8b','#ff8a00','#caff00']
  };

  const b2=[[0,2],[3,1]];
  const b4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  const b8=[
    [0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],
    [12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],
    [3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],
    [15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]
  ];

  let t=0, motionT=0, last=performance.now(), running=true, seed=Math.random()*9999;

  const presets = {
    blockplasma:{dither:'bayer4',charset:'blocks2',density:116,contrast:210,threshold:0,ditherAmt:72,warp:50,wave:65,twist:20,zoom:100,speed:86,poster:false},
    roto:{dither:'bayer4',charset:'blocks',density:108,contrast:235,threshold:-4,ditherAmt:60,warp:30,wave:35,twist:72,zoom:110,speed:92,poster:false},
    tunnel:{dither:'bayer8',charset:'ascii',density:132,contrast:190,threshold:-8,ditherAmt:82,warp:55,wave:72,twist:34,zoom:92,speed:105,poster:false},
    checker:{dither:'bayer2',charset:'blocks',density:92,contrast:275,threshold:0,ditherAmt:55,warp:78,wave:82,twist:28,zoom:100,speed:70,poster:true},
    raster:{dither:'bayer4',charset:'blocks2',density:118,contrast:245,threshold:3,ditherAmt:68,warp:42,wave:96,twist:0,zoom:100,speed:88,poster:false},
    moire:{dither:'bayer8',charset:'thin',density:150,contrast:260,threshold:-2,ditherAmt:90,warp:24,wave:48,twist:46,zoom:120,speed:60,poster:false},
    worm:{dither:'noise',charset:'blocks2',density:126,contrast:220,threshold:0,ditherAmt:48,warp:90,wave:88,twist:-38,zoom:95,speed:72,poster:false},
    crush:{dither:'threshold',charset:'blocks',density:100,contrast:300,threshold:0,ditherAmt:100,warp:58,wave:72,twist:20,zoom:105,speed:84,poster:true},
    starburst:{dither:'bayer2',charset:'ascii',density:126,contrast:245,threshold:-5,ditherAmt:68,warp:22,wave:30,twist:48,zoom:95,speed:92,poster:false},
    wavefold:{dither:'bayer4',charset:'blocks2',density:120,contrast:235,threshold:2,ditherAmt:76,warp:88,wave:100,twist:-12,zoom:115,speed:78,poster:false},
    polar:{dither:'bayer8',charset:'thin',density:142,contrast:220,threshold:-4,ditherAmt:85,warp:36,wave:54,twist:80,zoom:90,speed:66,poster:false},
    cells:{dither:'noise',charset:'dots',density:134,contrast:255,threshold:5,ditherAmt:50,warp:48,wave:62,twist:10,zoom:105,speed:64,poster:true},
    zebra:{dither:'bayer4',charset:'blocks',density:104,contrast:285,threshold:0,ditherAmt:65,warp:92,wave:92,twist:-22,zoom:100,speed:76,poster:true},
    diamonds:{dither:'bayer2',charset:'blocks2',density:112,contrast:270,threshold:-2,ditherAmt:58,warp:56,wave:44,twist:0,zoom:110,speed:68,poster:true},
    crosshatch:{dither:'bayer8',charset:'thin',density:156,contrast:245,threshold:-8,ditherAmt:88,warp:18,wave:35,twist:18,zoom:120,speed:48,poster:false},
    storm:{dither:'noise',charset:'ascii',density:148,contrast:230,threshold:0,ditherAmt:95,warp:68,wave:80,twist:26,zoom:100,speed:125,poster:false},
    vertical:{dither:'bayer4',charset:'blocks2',density:110,contrast:255,threshold:2,ditherAmt:74,warp:72,wave:100,twist:0,zoom:100,speed:90,poster:false},
    interference:{dither:'bayer8',charset:'blocks',density:136,contrast:260,threshold:-3,ditherAmt:92,warp:28,wave:42,twist:52,zoom:105,speed:58,poster:false}
  };

  function hexRgb(h){
    h=h.replace('#','');
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }

  function mix(a,b,t){
    return a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  }

  function paletteColor(v){
    const p=palettes[e.palette.value];
    v=(v-.5)*(+e.colorSpread.value/100)+.5;
    v=Math.max(0,Math.min(.9999,v));
    const pos=v*(p.length-1), i=Math.floor(pos), f=pos-i;
    return mix(hexRgb(p[i]),hexRgb(p[Math.min(i+1,p.length-1)]),f);
  }

  function renderSwatches(){
    e.swatches.innerHTML='';
    palettes[e.palette.value].forEach(col=>{
      const s=document.createElement('span');
      s.style.background=col;
      e.swatches.appendChild(s);
    });
  }

  function labels(){
    ['density','threshold','ditherAmt','warp','wave','twist','autoZoom']
      .forEach(k => $('#'+k+'V').textContent=e[k].value);

    ['contrast','zoom','speed','colorSpread','zoomRate','moveX','moveY','rotation']
      .forEach(k => $('#'+k+'V').textContent=(+e[k].value/100).toFixed(2));

    e.hud.textContent=
      e.preset.options[e.preset.selectedIndex].text+
      ' / '+
      e.palette.options[e.palette.selectedIndex].text;

    renderSwatches();
  }

  function applyPreset(name){
    Object.entries(presets[name]).forEach(([k,v])=>{
      if(!e[k]) return;
      if(typeof v==='boolean') e[k].checked=v;
      else e[k].value=v;
    });
    labels();
  }

  function hash(x,y){
    const n=Math.sin(x*127.1+y*311.7+seed)*43758.5453123;
    return n-Math.floor(n);
  }

  function coord(u,v,time){
    let x=u-.5, y=v-.5;

    const baseZoom=+e.zoom.value/100;
    const az=+e.autoZoom.value/100;
    const zr=+e.zoomRate.value/100;
    const motionZoom=1+az*Math.sin(motionT*zr*2.2);
    const Z=Math.max(.15,baseZoom*motionZoom);

    x/=Z; y/=Z;
    x+=motionT*(+e.moveX.value/100)*.22;
    y+=motionT*(+e.moveY.value/100)*.22;

    const autoRot=motionT*(+e.rotation.value/100)*.8;
    const cr=Math.cos(autoRot), sr=Math.sin(autoRot);
    const tx=x*cr-y*sr, ty=x*sr+y*cr;
    x=tx; y=ty;

    const W=+e.warp.value/100;
    const V=+e.wave.value/100;
    const T=+e.twist.value/100;

    const rr=Math.sqrt(x*x+y*y);
    const ang=T*(rr*3.2+Math.sin(time*.35)*.25);
    const ca=Math.cos(ang), sa=Math.sin(ang);

    let rx=x*ca-y*sa;
    let ry=x*sa+y*ca;

    rx+=Math.sin(ry*8+time*1.1)*.08*W;
    ry+=Math.sin(rx*7-time*.85)*.075*W;
    rx+=Math.sin((ry+time*.1)*18)*.025*V;

    return [rx,ry];
  }

  function field(u,v,time){
    const [x,y]=coord(u,v,time);
    const r=Math.sqrt(x*x+y*y);
    const a=Math.atan2(y,x);
    let f=.5;

    switch(e.preset.value){
      case 'roto': {
        const ca=Math.cos(time*.42), sa=Math.sin(time*.42);
        const xx=x*ca-y*sa, yy=x*sa+y*ca;
        f=.5+.25*Math.sin(xx*25+time*1.3)+.25*Math.sin(yy*25-time*.8)+.13*Math.sin((xx+yy)*38);
        break;
      }
      case 'tunnel':
        f=.5+.26*Math.sin(34*r-time*2.2+Math.sin(a*7-time*.4)*2)+.18*Math.sin(a*9+time*.7)+.08*Math.sin(r*90);
        break;
      case 'checker':
        f=.5+.5*Math.sin((x+Math.sin(y*9+time)*.06)*28)*Math.sin((y+Math.sin(x*8-time)*.06)*28);
        break;
      case 'raster':
        f=.5+.34*Math.sin(y*41+Math.sin(x*12+time)*4.2-time*1.8)+.16*Math.sin(x*18+time*.6)+.08*Math.sin((x+y)*70);
        break;
      case 'moire':
        f=.5+.23*Math.sin(r*95-time*.8)+.23*Math.sin((x*.83+y)*73+time*.45)+.18*Math.sin((x-y*.7)*91-time*.6);
        break;
      case 'worm':
        f=.5+.25*Math.sin(x*18+Math.sin(y*10+time)*4)+.22*Math.sin(y*23+Math.sin(x*8-time)*3.3)+.14*Math.sin((x+y)*50-time);
        break;
      case 'crush':
        f=.5+.32*Math.sin(x*17+time)+.3*Math.sin(y*21-time*.9)+.16*Math.sin(r*44-time*1.4);
        break;
      case 'starburst':
        f=.5+.34*Math.sin(a*14+r*38-time*1.7)+.19*Math.sin(a*6-time*.6)+.12*Math.sin(r*80);
        break;
      case 'wavefold':
        f=.5+.31*Math.sin((x+Math.sin(y*11+time)*.14)*24)+.25*Math.sin((y+Math.sin(x*9-time)*.12)*29)+.1*Math.sin((x-y)*55);
        break;
      case 'polar':
        f=.5+.22*Math.sin(a*12+time*.7)+.22*Math.sin(r*55-time)+.19*Math.sin(a*7-r*33+time*.5);
        break;
      case 'cells': {
        const cx=Math.sin(x*18+time)+Math.sin(y*15-time*.8);
        const cy=Math.sin((x+y)*21-time*.45);
        f=.5+.28*Math.sin(cx*2.4)+.22*Math.sin(cy*2.2);
        break;
      }
      case 'zebra':
        f=.5+.42*Math.sin((x+Math.sin(y*7+time)*.18)*25+Math.sin(y*13-time)*2.2);
        break;
      case 'diamonds':
        f=.5+.33*Math.sin((Math.abs(x)+Math.abs(y))*42-time*1.2)+.18*Math.sin((x-y)*26+time*.55);
        break;
      case 'crosshatch':
        f=.5+.21*Math.sin((x+y)*72+time*.35)+.21*Math.sin((x-y)*76-time*.28)+.14*Math.sin(y*19+time);
        break;
      case 'storm':
        f=.5+.2*Math.sin(x*38+time*2.1)+.18*Math.sin(y*43-time*1.7)+.16*Math.sin((x+y)*70+time)+
          .14*(hash(Math.floor((x+1)*120+time*8),Math.floor((y+1)*120))-.5)*2;
        break;
      case 'vertical':
        f=.5+.34*Math.sin(x*31+Math.sin(y*10+time)*5)+.2*Math.sin(y*18-time*1.4)+.12*Math.sin(x*80);
        break;
      case 'interference':
        f=.5+.23*Math.sin(r*82-time*.8)+.21*Math.sin((x*.7+y)*67+time*.5)+.21*Math.sin((x-y*.8)*73-time*.45);
        break;
      default:
        f=.5+.2*Math.sin(x*17+time*1.1)+.2*Math.sin(y*21-time*.9)+.15*Math.sin((x+y)*31+time*.45)+.12*Math.sin(r*53-time*1.35)+.08*Math.sin((x-y)*67);
    }

    f+=(hash(Math.floor(u*150),Math.floor(v*150))-.5)*.035;
    return Math.max(0,Math.min(1,f));
  }

  function ditherValue(v,x,y){
    const amt=+e.ditherAmt.value/100;
    const m=e.dither.value;

    if(m==='none') return v;
    if(m==='threshold') return v>.5?1:0;
    if(m==='noise') return v+(hash(x,y)-.5)*.42*amt;
    if(m==='bayer2') return v+(((b2[y%2][x%2]+.5)/4)-.5)*.42*amt;
    if(m==='bayer8') return v+(((b8[y%8][x%8]+.5)/64)-.5)*.42*amt;
    return v+(((b4[y%4][x%4]+.5)/16)-.5)*.42*amt;
  }

  function resize(){
    const r=c.getBoundingClientRect();
    const d=Math.min(window.devicePixelRatio||1,2);
    c.width=Math.max(640,Math.floor(r.width*d));
    c.height=Math.max(360,Math.floor(r.height*d));
  }

  function draw(){
    const now=performance.now();
    const dt=Math.min(.05,(now-last)/1000);
    last=now;

    if(running){
      t+=dt*(+e.speed.value/100)*2;
      motionT+=dt;
    }

    const w=c.width, h=c.height;
    const pal=palettes[e.palette.value];
    const bg=hexRgb(pal[0]);

    ctx.fillStyle='rgb('+bg.join(',')+')';
    ctx.fillRect(0,0,w,h);

    const cols=+e.density.value;
    const cell=w/cols;
    const rows=Math.ceil(h/cell);
    const chars=e.charset.value==='custom' ? (e.custom.value||'█▓▒░ ') : (sets[e.charset.value]||sets.blocks);
    const contrast=+e.contrast.value/100;
    const shift=+e.threshold.value/100;

    ctx.font=Math.ceil(cell*1.16)+'px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    ctx.textAlign='center';
    ctx.textBaseline='top';

    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        let f=field((x+.5)/cols,(y+.5)/rows,t);
        f=(f-.5)*contrast+.5+shift;

        if(e.poster.checked) f=Math.round(f*4)/4;

        f=ditherValue(f,x,y);
        f=Math.max(0,Math.min(1,f));

        if(e.invert.checked) f=1-f;

        const idx=Math.min(chars.length-1,Math.max(0,Math.floor((1-f)*chars.length)));
        const ch=chars[idx]||' ';

        if(ch!==' '){
          const col=paletteColor(f);
          ctx.fillStyle='rgb('+col.join(',')+')';
          ctx.fillText(ch,(x+.5)*cell,y*cell-cell*.04);
        }
      }
    }

    if(e.scan.checked){
      ctx.fillStyle='rgba(0,0,0,.22)';
      for(let y=0;y<h;y+=4) ctx.fillRect(0,y,w,1);
    }

    requestAnimationFrame(draw);
  }

  function toggleRun(){
    running=!running;
    e.pause.textContent=running?'Pause':'Play';
  }

  function toggleUI(){
    app.classList.toggle('ui-hidden');
    e.hideBtn.textContent=app.classList.contains('ui-hidden')?'Show UI':'Hide UI';
    setTimeout(resize,30);
  }

  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    }catch(err){}
  }

  e.preset.addEventListener('change',()=>applyPreset(e.preset.value));
  e.palette.addEventListener('change',labels);

  [
    'density','contrast','threshold','ditherAmt','warp','wave','twist',
    'zoom','speed','colorSpread','autoZoom','zoomRate','moveX','moveY','rotation'
  ].forEach(k=>e[k].addEventListener('input',labels));

  ['dither','charset'].forEach(k=>e[k].addEventListener('change',labels));

  e.motionOff.addEventListener('click',()=>{
    e.autoZoom.value=0;
    e.moveX.value=0;
    e.moveY.value=0;
    e.rotation.value=0;
    labels();
  });

  e.motionRandom.addEventListener('click',()=>{
    e.autoZoom.value=Math.floor(Math.random()*50);
    e.zoomRate.value=Math.floor(Math.random()*180)-90;
    e.moveX.value=Math.floor(Math.random()*80)-40;
    e.moveY.value=Math.floor(Math.random()*80)-40;
    e.rotation.value=Math.floor(Math.random()*100)-50;
    labels();
  });

  e.random.addEventListener('click',()=>{
    seed=Math.random()*9999;
    const names=Object.keys(presets);
    e.preset.value=names[Math.floor(Math.random()*names.length)];
    applyPreset(e.preset.value);

    const pn=Object.keys(palettes);
    e.palette.value=pn[Math.floor(Math.random()*pn.length)];

    e.motionRandom.click();
    labels();
  });

  e.pause.addEventListener('click',toggleRun);
  e.fullscreenBtn.addEventListener('click',toggleFullscreen);
  e.hideBtn.addEventListener('click',toggleUI);

  document.addEventListener('fullscreenchange',()=>{
    e.fullscreenBtn.textContent=document.fullscreenElement?'Exit Fullscreen':'Fullscreen';
    setTimeout(resize,30);
  });

  window.addEventListener('resize',resize);

  window.addEventListener('keydown',ev=>{
    const tag=document.activeElement?.tagName;
    if(tag==='INPUT'||tag==='SELECT') return;

    if(ev.code==='Space'){
      ev.preventDefault();
      toggleRun();
    }else if(ev.key==='f'||ev.key==='F'){
      toggleFullscreen();
    }else if(ev.key==='h'||ev.key==='H'){
      toggleUI();
    }else if(ev.key==='r'||ev.key==='R'){
      e.random.click();
    }
  });

  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    running=false;
    e.pause.textContent='Play';
  }

  e.palette.value='outer';
  applyPreset('blockplasma');
  labels();
  resize();
  draw();
})();
</script>
</body>
</html>
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
