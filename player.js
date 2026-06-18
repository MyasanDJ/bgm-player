const params=new URLSearchParams(location.search);
const sheetPopup=params.get("sheet")==="1" || params.get("popup")==="1";
const safeMode=params.get("safe")==="1";
const shouldAutoplay=params.get("autoplay")==="1";
const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if(isMobile){
  document.documentElement.classList.add("mobile");
  document.body.classList.add("mobile");
}
if(sheetPopup)document.body.classList.add("sheetPopup");

const player=document.getElementById("player");
const restoreBtn=document.getElementById("restoreBtn");
const audio=document.getElementById("audio");

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
const songTitle=document.getElementById("songTitle");
const trackInfo=document.getElementById("trackInfo");
const statusText=document.getElementById("statusText");
const canvas=document.getElementById("visualizer");
const ctx=canvas.getContext("2d");
const coverImg=document.getElementById("coverImg");

const defaultTitle=player.dataset.trackTitle||"BGM";

// ★ここだけ編集してください。曲数もここで決まります。
// src: 音源ファイル名 / title: 大きく表示する曲名 / cover: ジャケット画像
const playlist=[
  {src:"track1.mp3", title:"#あくあ色ぱれっと", cover:"cover1.jpg"},
  {src:"track2.mp3", title:"海想列車", cover:"cover2.jpg"},
   {src:"track3.mp3", title:"墓A・RA・SHI", cover:"cover3.png"},
   {src:"track4.mp3", title:"Howling", cover:"cover4.jpg"},
   {src:"track5.mp3", title:"グローエンブレイス", cover:"cover5.jpg"},
   {src:"track6.mp3", title:"KON KON Beats by Mio", cover:"cover6.png"}
];

// 3曲目を追加したい場合は、この中に1行追加してください。
// {src:"track3.mp3", title:"3曲目のタイトル", cover:"cover3.png"}

let audioCtx,analyser,source,dataArray,raf;
let currentTrack=1;
let currentExtIndex=0;
let mode="all"; // all / one / none
let isLoading=false;
let userStarted=false;

function guessType(src){
  const x=src.toLowerCase();
  if(x.endsWith(".mp3"))return "audio/mpeg";
  if(x.endsWith(".m4a"))return "audio/mp4";
  if(x.endsWith(".wav"))return "audio/wav";
  return "";
}

function setAudioSource(src,type){
  audio.innerHTML=`<source src="${src}" type="${type}">`;
  audio.load();
}

function updateText(){
  const track=playlist[currentTrack-1];
  if(!track){
    songTitle.textContent="音声ファイルなし";
    trackInfo.textContent="NO TRACK";
    return;
  }
  songTitle.textContent=track.title || `Track ${currentTrack}`;
  trackInfo.textContent=`TRACK ${currentTrack} / ${playlist.length}`;
}

function loadTrack(trackNumber, autoplay=true){
  if(!playlist.length){
    statusText.textContent="NO AUDIO";
    updateText();
    return;
  }
  // playlistの曲数を超えたら、存在しないtrackへ進まず最初へ戻る
  if(trackNumber>playlist.length)trackNumber=1;
  if(trackNumber<1)trackNumber=playlist.length;

  currentTrack=trackNumber;
  const track=playlist[currentTrack-1];
  updateText();
  loadCoverForTrack(track);
  statusText.textContent="READY";
  seek.value=0;
  current.textContent="0:00";
  duration.textContent="0:00";
  setAudioSource(track.src,guessType(track.src));
  if(autoplay)setTimeout(()=>startAudio(),160);
}

function loadCoverForTrack(track){
  coverImg.style.display="none";
  if(!track || !track.cover)return;
  coverImg.src=track.cover;
  coverImg.onload=()=>{coverImg.style.display="block"};
  coverImg.onerror=()=>{coverImg.style.display="none"};
}

function fmt(sec){
  if(!isFinite(sec))return"0:00";
  const m=Math.floor(sec/60);
  const s=Math.floor(sec%60).toString().padStart(2,"0");
  return`${m}:${s}`;
}

function save(){
  if(sheetPopup)return;
  localStorage.setItem("bgmState",JSON.stringify({
    volume:audio.volume,
    muted:audio.muted,
    mini:player.classList.contains("mini"),
    hidden:player.classList.contains("hidden"),
    left:player.style.left,
    top:player.style.top,
    mode
  }));
}

function loadState(){
  if(sheetPopup)return;
  try{
    const s=JSON.parse(localStorage.getItem("bgmState")||"{}");
    if(typeof s.volume==="number"&&!isMobile){
      audio.volume=s.volume;
      volume.value=Math.round(s.volume*100);
      volText.textContent=volume.value+"%";
    }
    if(s.muted&&!isMobile){
      audio.muted=true;
      mute.textContent="🔇";
    }
    if(["all","one","none"].includes(s.mode))mode=s.mode;
    updateLoopButton();
    if(s.mini)player.classList.add("mini");
    if(s.hidden&&!isMobile){
      player.classList.add("hidden");
      restoreBtn.style.display="block";
    }
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
  source=audioCtx.createMediaElementSource(audio);
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
  userStarted=true;
  setupAudio();
  if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();
  try{
    await audio.play();
  }catch(e){
    statusText.textContent="TAP AGAIN";
    console.log(e);
  }
}

function nextTrack(autoplay=true){
  // playlist.length を基準にするので、存在しないtrack3などへは進みません
  loadTrack(currentTrack+1,autoplay);
}

function prevTrack(){
  if(audio.currentTime>3){
    audio.currentTime=0;
    return;
  }
  loadTrack(currentTrack-1,true);
}

function updateLoopButton(){
  loopBtn.classList.toggle("active",mode!=="none");
  if(mode==="all"){loopBtn.textContent="🔁";loopBtn.title="全曲ループ"}
  if(mode==="one"){loopBtn.textContent="🔂";loopBtn.title="1曲ループ"}
  if(mode==="none"){loopBtn.textContent="➡️";loopBtn.title="ループなし"}
}

play.onclick=async()=>{
  if(audio.paused)await startAudio();
  else audio.pause();
};

prevBtn.onclick=()=>prevTrack();
nextBtn.onclick=()=>nextTrack(true);

loopBtn.onclick=()=>{
  if(mode==="all")mode="one";
  else if(mode==="one")mode="none";
  else mode="all";
  updateLoopButton();
  save();
};

mute.onclick=()=>{
  audio.muted=!audio.muted;
  mute.textContent=audio.muted?"🔇":"🔊";
  save();
};

audio.addEventListener("play",async()=>{
  setupAudio();
  if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();
  isLoading=false;
  play.textContent="⏸";
  statusText.textContent="NOW PLAYING";
  player.classList.add("playing");
  cancelAnimationFrame(raf);
  draw();
});

audio.addEventListener("pause",()=>{
  play.textContent="▶";
  player.classList.remove("playing");
  cancelAnimationFrame(raf);
  drawIdle();
});

audio.addEventListener("ended",()=>{
  if(mode==="one"){
    audio.currentTime=0;
    startAudio();
  }else if(mode==="all"){
    nextTrack(true);
  }else{
    if(currentTrack<playlist.length)nextTrack(true);
    else statusText.textContent="ENDED";
  }
});

audio.addEventListener("error",()=>{
  statusText.textContent="LOAD ERROR";
  play.textContent="▶";
  player.classList.remove("playing");
});

audio.onloadedmetadata=()=>{
  seek.max=audio.duration||0;
  duration.textContent=fmt(audio.duration);
  statusText.textContent="READY";
};

audio.ontimeupdate=()=>{
  seek.value=audio.currentTime||0;
  current.textContent=fmt(audio.currentTime);
};

seek.oninput=()=>audio.currentTime=seek.value;

volume.oninput=()=>{
  audio.volume=volume.value/100;
  audio.muted=false;
  mute.textContent="🔊";
  volText.textContent=volume.value+"%";
  save();
};

document.addEventListener("visibilitychange",()=>{
  if(isMobile || safeMode){
    if(document.hidden){
      if(!audio.paused){
        audio.pause();
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

miniBtn.onclick=()=>{
  player.classList.add("mini");
  save();
};

player.querySelector(".topbar").ondblclick=()=>{
  if(!sheetPopup){
    player.classList.toggle("mini");
    save();
  }
};

restoreBtn.onclick=()=>{
  player.classList.remove("hidden","mini");
  restoreBtn.style.display="none";
  save();
};

player.querySelector(".topbar").onclick=()=>{
  if(player.classList.contains("mini")){
    player.classList.remove("mini");
    save();
  }
};

resetBtn.onclick=()=>{
  player.style.left="auto";
  player.style.top="auto";
  player.style.right="24px";
  player.style.bottom="24px";
  save();
};

moveBtn.onclick=()=>{
  if(isMobile||sheetPopup)return;
  player.classList.toggle("moveMode");
  moveBtn.classList.toggle("active");
};

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

document.addEventListener("mouseup",()=>{
  if(dragging){
    dragging=false;
    save();
  }
});

drawIdle();
loadState();
loadTrack(1,false);
if(shouldAutoplay && !isMobile) setTimeout(()=>startAudio(),400);
