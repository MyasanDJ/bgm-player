const params=new URLSearchParams(location.search);
const sheetPopup=params.get("sheet")==="1" || params.get("popup")==="1";
const shouldAutoplay=params.get("autoplay")==="1";
const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if(isMobile)document.body.classList.add("mobile");
if(sheetPopup)document.body.classList.add("sheetPopup");

const player=document.getElementById("player");
const restoreBtn=document.getElementById("restoreBtn");
const audio=document.getElementById("audio");
const nativeAudio=document.getElementById("nativeAudio");
const mainAudio=(isMobile&&!sheetPopup)?nativeAudio:audio;

const play=document.getElementById("play");
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
const canvas=document.getElementById("visualizer");
const ctx=canvas.getContext("2d");
const coverImg=document.getElementById("coverImg");

title.textContent=player.dataset.trackTitle||"BGM";

const audioFiles=[
  {src:"bgm.mp3",type:"audio/mpeg"},
  {src:"bgm.m4a",type:"audio/mp4"},
  {src:"bgm.wav",type:"audio/wav"},
  {src:"bgm.wav",type:"audio/x-wav"}
];

async function fileExists(url){
  try{const res=await fetch(url,{method:"HEAD",cache:"no-store"});return res.ok}catch(e){return false}
}
async function loadFirstExistingAudio(){
  for(const file of audioFiles){
    if(await fileExists(file.src)){
      mainAudio.innerHTML=`<source src="${file.src}" type="${file.type}">`;
      mainAudio.load();
      if(shouldAutoplay) setTimeout(()=>startAudio(),250);
      return;
    }
  }
}
loadFirstExistingAudio();

const coverFiles=["cover.png","cover.jpg","cover.jpeg"];
let coverIndex=0;
function loadCover(){
  coverImg.onerror=()=>{coverIndex++; if(coverIndex<coverFiles.length)coverImg.src=coverFiles[coverIndex]; else coverImg.style.display="none"};
  coverImg.onload=()=>{coverImg.style.display="block"};
  coverImg.src=coverFiles[coverIndex];
}
loadCover();

let audioCtx,analyser,source,dataArray,raf;
function fmt(sec){if(!isFinite(sec))return"0:00";const m=Math.floor(sec/60);const s=Math.floor(sec%60).toString().padStart(2,"0");return`${m}:${s}`}
function save(){
  if(sheetPopup)return;
  localStorage.setItem("bgmState",JSON.stringify({
    volume:mainAudio.volume, muted:mainAudio.muted, mini:player.classList.contains("mini"),
    hidden:player.classList.contains("hidden"), left:player.style.left, top:player.style.top
  }));
}
function load(){
  if(sheetPopup)return;
  try{
    const s=JSON.parse(localStorage.getItem("bgmState")||"{}");
    if(typeof s.volume==="number"&&!isMobile){mainAudio.volume=s.volume;volume.value=Math.round(s.volume*100);volText.textContent=volume.value+"%"}
    if(s.muted&&!isMobile){mainAudio.muted=true;mute.textContent="🔇"}
    if(s.mini)player.classList.add("mini");
    if(s.hidden&&!isMobile){player.classList.add("hidden");restoreBtn.style.display="block"}
    if(s.left&&!isMobile){player.style.left=s.left;player.style.top=s.top;player.style.right="auto";player.style.bottom="auto"}
  }catch(e){}
}
load();

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
  for(let i=0;i<36;i++){const h=8+Math.sin(i*.7)*5;ctx.fillStyle="rgba(90,220,255,.45)";ctx.fillRect(i*7+5,canvas.height-h-8,4,h)}
}
function draw(){
  raf=requestAnimationFrame(draw);
  if(!analyser)return;
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bars=42,w=canvas.width/bars;
  for(let i=0;i<bars;i++){
    const v=dataArray[i]||0;const h=Math.max(4,(v/255)*canvas.height*.9);
    const g=ctx.createLinearGradient(0,canvas.height-h,0,canvas.height);
    g.addColorStop(0,"#b468ff");g.addColorStop(.45,"#42d8ff");g.addColorStop(1,"#1766ff");
    ctx.fillStyle=g;ctx.shadowColor="#55dfff";ctx.shadowBlur=8;ctx.fillRect(i*w+2,canvas.height-h-4,w-4,h);
  }
}
drawIdle();

async function startAudio(){
  setupAudio();
  if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();
  try{await mainAudio.play()}catch(e){console.log("autoplay blocked or audio missing",e)}
}
play.onclick=async()=>{if(mainAudio.paused)await startAudio();else mainAudio.pause()};

mainAudio.addEventListener("play",async()=>{
  setupAudio();
  if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();
  play.textContent="⏸";
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
mainAudio.onloadedmetadata=()=>{seek.max=mainAudio.duration||0;duration.textContent=fmt(mainAudio.duration)};
mainAudio.ontimeupdate=()=>{seek.value=mainAudio.currentTime||0;current.textContent=fmt(mainAudio.currentTime)};
mainAudio.onerror=()=>{play.textContent="▶";player.classList.remove("playing")};

seek.oninput=()=>mainAudio.currentTime=seek.value;
volume.oninput=()=>{mainAudio.volume=volume.value/100;mainAudio.muted=false;mute.textContent="🔊";volText.textContent=volume.value+"%";save()};
loopBtn.onclick=()=>{mainAudio.loop=!mainAudio.loop;loopBtn.classList.toggle("active",mainAudio.loop)};
mute.onclick=()=>{mainAudio.muted=!mainAudio.muted;mute.textContent=mainAudio.muted?"🔇":"🔊";save()};

document.addEventListener("visibilitychange",()=>{
  if(isMobile){
    play.textContent=mainAudio.paused?"▶":"⏸";
    player.classList.toggle("playing",!mainAudio.paused);
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
  dragging=true;ox=e.clientX-player.offsetLeft;oy=e.clientY-player.offsetTop;
});
document.addEventListener("mousemove",e=>{
  if(!dragging)return;
  player.style.left=(e.clientX-ox)+"px";player.style.top=(e.clientY-oy)+"px";
  player.style.right="auto";player.style.bottom="auto";
});
document.addEventListener("mouseup",()=>{if(dragging){dragging=false;save()}});
