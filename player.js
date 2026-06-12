const params=new URLSearchParams(location.search);
const sheetPopup=params.get("sheet")==="1" || params.get("popup")==="1";
const safeMode=params.get("safe")==="1";
const shouldAutoplay=params.get("autoplay")==="1";
const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if(isMobile){document.documentElement.classList.add("mobile");document.body.classList.add("mobile")}
if(sheetPopup)document.body.classList.add("sheetPopup");

const player=document.getElementById("player");
const restoreBtn=document.getElementById("restoreBtn");
const mainAudio=document.getElementById("audio");

const play=document.getElementById("play");
const prevBtn=document.getElementById("prev");
const nextBtn=document.getElementById("next");
const volume=document.getElementById("volume");
const volText=document.getElementById("volText");
const seek=document.getElementById("seek");
const current=document.getElementById("current");
const duration=document.getElementById("duration");
const loopBtn=document.getElementById("loop");
const mute=document.getElementById("mute");
const miniBtn=document.getElementById("miniBtn");
const resetBtn=document.getElementById("resetBtn");
const moveBtn=document.getElementById("moveBtn");
const title=document.getElementById("title");
const trackCount=document.getElementById("trackCount");
const statusText=document.getElementById("statusText");
const canvas=document.getElementById("visualizer");
const ctx=canvas.getContext("2d");
const coverImg=document.getElementById("coverImg");

const defaultTitle=player.dataset.trackTitle||"BGM";
const loopModes=["all","one","none"];
let loopMode="all";
let currentIndex=0;
let playlist=[];
const maxTracks=30;
const formats=[
  {ext:"mp3",type:"audio/mpeg"},
  {ext:"m4a",type:"audio/mp4"},
  {ext:"wav",type:"audio/wav"},
  {ext:"wav",type:"audio/x-wav"}
];

async function fileExists(url){
  try{
    const res=await fetch(url,{method:"HEAD",cache:"no-store"});
    return res.ok;
  }catch(e){return false}
}

async function buildPlaylist(){
  const found=[];
  for(let i=1;i<=maxTracks;i++){
    for(const f of formats){
      const src=`track${i}.${f.ext}`;
      if(await fileExists(src)){
        found.push({src,type:f.type,title:`Track ${i}`,coverBase:`cover${i}`});
        break;
      }
    }
  }

  // 互換用：track1系がない場合だけ従来のbgm.*を1曲として読む
  if(found.length===0){
    const bgmFiles=[
      {src:"bgm.mp3",type:"audio/mpeg"},
      {src:"bgm.m4a",type:"audio/mp4"},
      {src:"bgm.wav",type:"audio/wav"},
      {src:"bgm.wav",type:"audio/x-wav"}
    ];
    for(const f of bgmFiles){
      if(await fileExists(f.src)){
        found.push({src:f.src,type:f.type,title:defaultTitle,coverBase:"cover"});
        break;
      }
    }
  }

  playlist=found;
  if(playlist.length){
    await loadTrack(0,false);
    if(shouldAutoplay && !isMobile) setTimeout(()=>startAudio(),250);
  }else{
    title.textContent="音声ファイルなし";
    trackCount.textContent="track1.mp3 などを配置";
  }
}

async function loadCoverForTrack(i){
  coverImg.style.display="none";
  const bases=[playlist[i]?.coverBase,"cover"].filter(Boolean);
  const exts=["png","jpg","jpeg"];
  for(const base of bases){
    for(const ext of exts){
      const src=`${base}.${ext}`;
      if(await fileExists(src)){
        coverImg.src=src;
        coverImg.onload=()=>{coverImg.style.display="block"};
        coverImg.onerror=()=>{coverImg.style.display="none"};
        return;
      }
    }
  }
}

async function loadTrack(index, autoplay=true){
  if(!playlist.length)return;
  currentIndex=(index+playlist.length)%playlist.length;
  const track=playlist[currentIndex];
  const shouldResume=autoplay || !mainAudio.paused;

  mainAudio.pause();
  mainAudio.innerHTML=`<source src="${track.src}" type="${track.type}">`;
  mainAudio.load();

  title.textContent=track.title;
  trackCount.textContent=`TRACK ${currentIndex+1} / ${playlist.length}`;
  statusText.textContent="READY";
  seek.value=0;
  current.textContent="0:00";
  duration.textContent="0:00";
  await loadCoverForTrack(currentIndex);

  if(shouldResume) setTimeout(()=>startAudio(),120);
}

function nextTrack(autoplay=true){
  if(!playlist.length)return;
  if(currentIndex>=playlist.length-1 && loopMode==="none"){
    mainAudio.pause();
    mainAudio.currentTime=0;
    statusText.textContent="ENDED";
    return;
  }
  loadTrack(currentIndex+1,autoplay);
}
function prevTrack(){
  if(!playlist.length)return;
  if(mainAudio.currentTime>3){
    mainAudio.currentTime=0;
  }else{
    loadTrack(currentIndex-1,true);
  }
}

let audioCtx,analyser,source,dataArray,raf;
function fmt(sec){if(!isFinite(sec))return"0:00";const m=Math.floor(sec/60);const s=Math.floor(sec%60).toString().padStart(2,"0");return`${m}:${s}`}

function save(){
  if(sheetPopup)return;
  localStorage.setItem("bgmState",JSON.stringify({
    volume:mainAudio.volume,
    muted:mainAudio.muted,
    mini:player.classList.contains("mini"),
    hidden:player.classList.contains("hidden"),
    left:player.style.left,
    top:player.style.top,
    loopMode
  }));
}
function loadState(){
  if(sheetPopup)return;
  try{
    const s=JSON.parse(localStorage.getItem("bgmState")||"{}");
    if(typeof s.volume==="number"&&!isMobile){
      mainAudio.volume=s.volume;
      volume.value=Math.round(s.volume*100);
      volText.textContent=volume.value+"%";
    }
    if(s.muted&&!isMobile){mainAudio.muted=true;mute.textContent="🔇"}
    if(loopModes.includes(s.loopMode)){loopMode=s.loopMode}
    updateLoopButton();
    if(s.mini)player.classList.add("mini");
    if(s.hidden&&!isMobile){player.classList.add("hidden");restoreBtn.style.display="block"}
    if(s.left&&!isMobile){
      player.style.left=s.left;
      player.style.top=s.top;
      player.style.right="auto";
      player.style.bottom="auto";
    }
  }catch(e){}
}

function setupAudio(){
  if(audioCtx)return;
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  analyser=audioCtx.createAnalyser();
  analyser.fftSize=128;
  dataArray=new Uint8Array(analyser.frequencyBinCount);
  source=audioCtx.createMediaElementSource(mainAudio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}
function drawIdle(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<36;i++){
    const h=8+Math.sin(i*.7)*5;
    ctx.fillStyle="rgba(90,220,255,.45)";
    ctx.fillRect(i*7+5,canvas.height-h-8,4,h);
  }
}
function draw(){
  raf=requestAnimationFrame(draw);
  if(!analyser)return;
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bars=42,w=canvas.width/bars;
  for(let i=0;i<bars;i++){
    const v=dataArray[i]||0;
    const h=Math.max(4,(v/255)*canvas.height*.9);
    const g=ctx.createLinearGradient(0,canvas.height-h,0,canvas.height);
    g.addColorStop(0,"#b468ff");
    g.addColorStop(.45,"#42d8ff");
    g.addColorStop(1,"#1766ff");
    ctx.fillStyle=g;
    ctx.shadowColor="#55dfff";
    ctx.shadowBlur=8;
    ctx.fillRect(i*w+2,canvas.height-h-4,w-4,h);
  }
}

async function startAudio(){
  setupAudio();
  if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();
  try{await mainAudio.play()}catch(e){console.log("play blocked or missing",e)}
}

function updateLoopButton(){
  loopBtn.classList.toggle("active",loopMode!=="none");
  if(loopMode==="all"){loopBtn.textContent="🔁";loopBtn.title="全曲ループ"}
  if(loopMode==="one"){loopBtn.textContent="🔂";loopBtn.title="1曲ループ"}
  if(loopMode==="none"){loopBtn.textContent="➡️";loopBtn.title="ループなし"}
}

play.onclick=async()=>{if(mainAudio.paused)await startAudio();else mainAudio.pause()};
prevBtn.onclick=()=>prevTrack();
nextBtn.onclick=()=>nextTrack(true);
loopBtn.onclick=()=>{
  const idx=loopModes.indexOf(loopMode);
  loopMode=loopModes[(idx+1)%loopModes.length];
  updateLoopButton();
  save();
};
mute.onclick=()=>{mainAudio.muted=!mainAudio.muted;mute.textContent=mainAudio.muted?"🔇":"🔊";save()};

mainAudio.addEventListener("play",async()=>{
  setupAudio();
  if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();
  play.textContent="⏸";
  statusText.textContent="NOW PLAYING";
  player.classList.add("playing");
  cancelAnimationFrame(raf);
  draw();
});
mainAudio.addEventListener("pause",()=>{
  play.textContent="▶";
  player.classList.remove("playing");
  cancelAnimationFrame(raf);
  drawIdle();
});
mainAudio.addEventListener("ended",()=>{
  if(loopMode==="one"){
    mainAudio.currentTime=0;
    startAudio();
  }else{
    nextTrack(loopMode==="all");
  }
});
mainAudio.onloadedmetadata=()=>{seek.max=mainAudio.duration||0;duration.textContent=fmt(mainAudio.duration)};
mainAudio.ontimeupdate=()=>{seek.value=mainAudio.currentTime||0;current.textContent=fmt(mainAudio.currentTime)};
mainAudio.onerror=()=>{play.textContent="▶";player.classList.remove("playing")};

seek.oninput=()=>mainAudio.currentTime=seek.value;
volume.oninput=()=>{mainAudio.volume=volume.value/100;mainAudio.muted=false;mute.textContent="🔊";volText.textContent=volume.value+"%";save()};

document.addEventListener("visibilitychange",()=>{
  if(isMobile || safeMode){
    if(document.hidden){
      if(!mainAudio.paused){
        mainAudio.pause();
        statusText.textContent="PAUSED";
      }
      if(audioCtx && audioCtx.state==="running") audioCtx.suspend().catch(()=>{});
    }else{
      play.textContent="▶";
      player.classList.remove("playing");
      statusText.textContent="TAP PLAY";
    }
  }
});

miniBtn.onclick=()=>{player.classList.add("mini");save()};
player.querySelector(".topbar").ondblclick=()=>{if(!sheetPopup){player.classList.toggle("mini");save()}};
restoreBtn.onclick=()=>{player.classList.remove("hidden","mini");restoreBtn.style.display="none";save()};
player.querySelector(".topbar").onclick=()=>{if(player.classList.contains("mini")){player.classList.remove("mini");save()}};
resetBtn.onclick=()=>{player.style.left="auto";player.style.top="auto";player.style.right="24px";player.style.bottom="24px";save()};
moveBtn.onclick=()=>{if(isMobile||sheetPopup)return;player.classList.toggle("moveMode");moveBtn.classList.toggle("active")};

let dragging=false,ox=0,oy=0;
const handle=player.querySelector(".topbar");
handle.addEventListener("mousedown",e=>{
  if(isMobile||sheetPopup)return;
  if(!player.classList.contains("moveMode"))return;
  if(e.target.tagName==="BUTTON")return;
  dragging=true;
  ox=e.clientX-player.offsetLeft;
  oy=e.clientY-player.offsetTop;
});
document.addEventListener("mousemove",e=>{
  if(!dragging)return;
  player.style.left=(e.clientX-ox)+"px";
  player.style.top=(e.clientY-oy)+"px";
  player.style.right="auto";
  player.style.bottom="auto";
});
document.addEventListener("mouseup",()=>{if(dragging){dragging=false;save()}});

drawIdle();
loadState();
buildPlaylist();
