const params=new URLSearchParams(location.search);
const sheetPopup=params.get("sheet")==="1" || params.get("popup")==="1";
const safeMode=params.get("safe")==="1";
const shouldAutoplay=params.get("autoplay")==="1";
const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if(isMobile){document.documentElement.classList.add("mobile");document.body.classList.add("mobile")}
if(sheetPopup)document.body.classList.add("sheetPopup");
const player=document.getElementById("player"),restoreBtn=document.getElementById("restoreBtn"),audio=document.getElementById("audio");
const play=document.getElementById("play"),prevBtn=document.getElementById("prev"),nextBtn=document.getElementById("next"),volume=document.getElementById("volume"),volText=document.getElementById("volText"),seek=document.getElementById("seek"),current=document.getElementById("current"),duration=document.getElementById("duration"),loopBtn=document.getElementById("loop"),shuffleBtn=document.getElementById("shuffle"),miniBtn=document.getElementById("miniBtn"),resetBtn=document.getElementById("resetBtn"),moveBtn=document.getElementById("moveBtn"),songTitle=document.getElementById("songTitle"),trackInfo=document.getElementById("trackInfo"),statusText=document.getElementById("statusText"),canvas=document.getElementById("visualizer"),ctx=canvas.getContext("2d"),coverImg=document.getElementById("coverImg");
// ★ここだけ編集してください。
const playlist=[
{src:"track01.mp3", title:"夢色ワンダー", cover:"yumeiro.jpg"},
{src:"track02.mp3", title:"ギミギミエンターテイメント", cover:"gimigimi.png"},
{src:"track03.mp3", title:"Shiny Smily Story (2022 ver)", cover:"unit.jpeg"},
{src:"track04.mp3", title:"Shiny Smily Story (ヤマトファンタジアver.)", cover:"yamato.jpg"},
{src:"track05.mp3", title:"ビビデバ", cover:"bibideba.jpg"},
{src:"track06.mp3", title:"Stellar Stellar", cover:"stellar.jpg "},
{src:"track07.mp3", title:"DAIDAIDAIファンタジスタ", cover:"miko.jpg"},
{src:"track08.mp3", title:"シュガーラッシュ", cover:"micomet.jpg"},
{src:"track09.mp3", title:"ω猫", cover:"azki.jpg"},
{src:"track10.mp3", title:"いのち(2024 ver.)", cover:"inochi.jpg"},
{src:"track11.mp3", title:"かぷかぷ♡フィーバーナイト", cover:"kapukapu.PNG"},
{src:"track12.mp3", title:"＃あくあ色ぱれっと", cover:"aqua.jpg"},
{src:"track13.mp3", title:"SUPERNOVA", cover:"fubuki1.jpg"},
{src:"track14.mp3", title:"KINGWORLD", cover:"fubuki1.jpg"},
{src:"track15.mp3", title:"Howling", cover:"howling.jpg"},
{src:"track16.mp3", title:"Howling by Hoshino", cover:"Hoshino.PNG"},
{src:"track17.mp3", title:"Colorful Universe", cover:"mio2.jpg"},
{src:"track18.mp3", title:"夏宿り", cover:"mio1.png"},
{src:"track19.mp3", title:"もぐもぐYUMMY！", cover:"okayu1.jpg"},
{src:"track20.mp3", title:"ネコカブリーナ", cover:"okayu2.png"},
{src:"track21.mp3", title:"Doggy god's street", cover:"dog.jpg"},
{src:"track22.mp3", title:"WAO!! (2025 ver.)", cover:"koyori1.png"},
{src:"track23.mp3", title:"夢見る空へ", cover:"unit.jpeg"},
{src:"track24.mp3", title:"Suspect", cover:"unit.jpeg"},
{src:"track25.mp3", title:"BLUE CLAPPER", cover:"unit.jpeg"},
{src:"track26.mp3", title:"Carbonated Love", cover:"euro beat.png"},
{src:"track27.mp3", title:"会いたくて会いたくて ~Tatsunoshin Remix~", cover:"aitakute.png"}
];
const MIN_VOLUME=0.1;
let savedVolume=0.8;

audio.playsInline=true;
audio.defaultMuted=false;
audio.muted=false;
audio.setAttribute("playsinline","true");
audio.setAttribute("webkit-playsinline","true");
if(!Number.isFinite(audio.volume) || audio.volume<MIN_VOLUME){audio.volume=savedVolume;}
function enforceAudible(){
  audio.defaultMuted=false;
  audio.muted=false;
  audio.removeAttribute("muted");
  if(!Number.isFinite(audio.volume) || audio.volume<MIN_VOLUME){audio.volume=savedVolume||MIN_VOLUME;}
  if(audioCtx&&audioCtx.state==="suspended"&&!audio.paused){audioCtx.resume().catch(()=>{});}
}
let audioCtx,analyser,source,dataArray,raf;
let currentIndex=0,mode="all",shuffleMode=false,lastStatus="READY";
let shuffleQueue=[];
function guessType(src){const s=src.toLowerCase();if(s.endsWith(".mp3"))return"audio/mpeg";if(s.endsWith(".m4a"))return"audio/mp4";if(s.endsWith(".wav"))return"audio/wav";return""}
function setStatus(t){lastStatus=t;statusText.textContent=t}
function syncStatus(){
  enforceAudible();
  if(!playlist.length){setStatus("NO AUDIO");play.textContent="▶";player.classList.remove("playing");return}
  if(audio.error){setStatus("LOAD ERROR");play.textContent="▶";player.classList.remove("playing");return}
  if(audio.paused){play.textContent="▶";player.classList.remove("playing");if(lastStatus==="LOADING"||lastStatus==="ENDED")return;setStatus(audio.currentTime>0?"PAUSED":"READY")}
  else{play.textContent="⏸";player.classList.add("playing");setStatus("NOW PLAYING")}
}
function updateText(){const t=playlist[currentIndex];if(!t){songTitle.textContent="音声ファイルなし";trackInfo.textContent="NO TRACK";return}songTitle.textContent=t.title||`Track ${currentIndex+1}`;trackInfo.textContent=`TRACK ${currentIndex+1} / ${playlist.length}`}
function loadCover(t){coverImg.style.display="none";if(!t||!t.cover)return;coverImg.src=t.cover;coverImg.onload=()=>coverImg.style.display="block";coverImg.onerror=()=>coverImg.style.display="none"}
function loadTrack(i,autoplay=true){
  if(!playlist.length){updateText();syncStatus();return}
  currentIndex=(i+playlist.length)%playlist.length;const t=playlist[currentIndex];
  audio.pause();setStatus("LOADING");audio.innerHTML=`<source src="${t.src}" type="${guessType(t.src)}">`;audio.load();
  updateText();loadCover(t);seek.value=0;current.textContent="0:00";duration.textContent="0:00";
  if(autoplay)setTimeout(()=>startAudio(),160);else setTimeout(syncStatus,60);
}
function makeShuffleQueue(){
  shuffleQueue = playlist.map((_, index) => index);
  for(let i = shuffleQueue.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]];
  }

  // 1曲目だけは、現在再生中の曲と同じになりにくくする
  if(shuffleQueue.length > 1 && shuffleQueue[0] === currentIndex){
    [shuffleQueue[0], shuffleQueue[1]] = [shuffleQueue[1], shuffleQueue[0]];
  }
}

function getShuffleNextIndex(){
  if(playlist.length <= 1){
    return 0;
  }

  if(shuffleQueue.length === 0){
    makeShuffleQueue();
  }
  return shuffleQueue.shift();
}
function nextTrack(autoplay=true){
  if(!playlist.length)return;
  if(shuffleMode){
  loadTrack(getShuffleNextIndex(), autoplay);
  return;
}
  if(currentIndex>=playlist.length-1){if(mode==="none"){setStatus("ENDED");syncStatus();return}loadTrack(0,autoplay);return}
  loadTrack(currentIndex+1,autoplay);
}
function prevTrack(){if(!playlist.length)return;if(audio.currentTime>3){audio.currentTime=0;return}if(shuffleMode){loadTrack(randomIndex(),true);return}loadTrack(currentIndex-1,true)}
function fmt(sec){if(!isFinite(sec))return"0:00";const m=Math.floor(sec/60),s=Math.floor(sec%60).toString().padStart(2,"0");return`${m}:${s}`}
function save(){if(sheetPopup)return;localStorage.setItem("bgmState",JSON.stringify({volume:savedVolume,mini:player.classList.contains("mini"),hidden:player.classList.contains("hidden"),left:player.style.left,top:player.style.top,mode,shuffleMode}))}
function loadState(){if(sheetPopup)return;try{const s=JSON.parse(localStorage.getItem("bgmState")||"{}");if(typeof s.volume==="number"&&s.volume>=MIN_VOLUME){savedVolume=s.volume;audio.volume=savedVolume;if(!isMobile){volume.value=Math.round(savedVolume*100);volText.textContent=volume.value+"%"}}if(["all","one","none"].includes(s.mode))mode=s.mode;if(typeof s.shuffleMode==="boolean")shuffleMode=s.shuffleMode;updateLoopButton();updateShuffleButton();if(s.mini)player.classList.add("mini");if(s.hidden&&!isMobile){player.classList.add("hidden");restoreBtn.style.display="block"}if(s.left&&!isMobile){player.style.left=s.left;player.style.top=s.top;player.style.right="auto";player.style.bottom="auto"}}catch(e){}}
function setupAudio(){if(isMobile){return;}if(audioCtx)return;audioCtx=new (window.AudioContext||window.webkitAudioContext)();analyser=audioCtx.createAnalyser();analyser.fftSize=128;dataArray=new Uint8Array(analyser.frequencyBinCount);source=audioCtx.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioCtx.destination);}
function drawIdle(){ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<36;i++){const h=8+Math.sin(i*.7)*5;ctx.fillStyle="rgba(90,220,255,.45)";ctx.fillRect(i*7+5,canvas.height-h-8,4,h)}}
function draw(){raf=requestAnimationFrame(draw);if(!analyser)return;analyser.getByteFrequencyData(dataArray);ctx.clearRect(0,0,canvas.width,canvas.height);const bars=42,w=canvas.width/bars;for(let i=0;i<bars;i++){const v=dataArray[i]||0,h=Math.max(4,(v/255)*canvas.height*.9),g=ctx.createLinearGradient(0,canvas.height-h,0,canvas.height);g.addColorStop(0,"#b468ff");g.addColorStop(.45,"#42d8ff");g.addColorStop(1,"#1766ff");ctx.fillStyle=g;ctx.shadowColor="#55dfff";ctx.shadowBlur=8;ctx.fillRect(i*w+2,canvas.height-h-4,w-4,h)}}
async function startAudio(){if(!playlist.length){syncStatus();return;}enforceAudible();if(!isMobile){setupAudio();if(audioCtx&&audioCtx.state==="suspended"){await audioCtx.resume();}}try{await audio.play();enforceAudible();syncStatus();}catch(e){setStatus("TAP AGAIN");console.log(e);}}
function updateLoopButton(){loopBtn.classList.toggle("active",mode!=="none");if(mode==="all"){loopBtn.textContent="🔁";loopBtn.title="全曲ループ"}if(mode==="one"){loopBtn.textContent="🔂";loopBtn.title="1曲ループ"}if(mode==="none"){loopBtn.textContent="➡️";loopBtn.title="流しきり"}}
function updateShuffleButton(){
  shuffleBtn.classList.toggle("active", shuffleMode);
  shuffleBtn.setAttribute("aria-pressed", String(shuffleMode));
  shuffleBtn.title = shuffleMode ? "ランダム再生 ON" : "ランダム再生 OFF";
}
play.onclick=async()=>{if(audio.paused)await startAudio();else audio.pause()};
prevBtn.onclick=()=>prevTrack();nextBtn.onclick=()=>nextTrack(true);
loopBtn.onclick=()=>{if(mode==="all")mode="one";else if(mode==="one")mode="none";else mode="all";updateLoopButton();save()};
shuffleBtn.onclick=()=>{
  shuffleMode=!shuffleMode;
  if(shuffleMode){
    makeShuffleQueue();
  }else{
    shuffleQueue=[];
  }
  updateShuffleButton();
  save();
};
audio.addEventListener("play",()=>{enforceAudible();syncStatus();cancelAnimationFrame(raf);draw()});
audio.addEventListener("pause",()=>{syncStatus();cancelAnimationFrame(raf);drawIdle()});
audio.addEventListener("ended",()=>{if(mode==="one"){audio.currentTime=0;startAudio();return}if(shuffleMode){
  loadTrack(getShuffleNextIndex(), true);
  return;
}if(mode==="all"){nextTrack(true);return}if(currentIndex<playlist.length-1)loadTrack(currentIndex+1,true);else{setStatus("ENDED");syncStatus()}});
audio.addEventListener("error",()=>{setStatus("LOAD ERROR");syncStatus()});
audio.onloadedmetadata=()=>{seek.max=audio.duration||0;duration.textContent=fmt(audio.duration);if(audio.paused)setStatus("READY")};
audio.ontimeupdate=()=>{seek.value=audio.currentTime||0;current.textContent=fmt(audio.currentTime)};
seek.oninput=()=>audio.currentTime=seek.value;
volume.oninput=()=>{savedVolume=Math.max(MIN_VOLUME,volume.value/100);audio.volume=savedVolume;enforceAudible();volText.textContent=Math.round(savedVolume*100)+"%";save()};
audio.addEventListener("volumechange",()=>{
  if(audio.muted){audio.muted=false;audio.defaultMuted=false;audio.removeAttribute("muted");}
  if(audio.volume>=MIN_VOLUME){savedVolume=audio.volume;save();}
  else{audio.volume=savedVolume||MIN_VOLUME;}
});
document.addEventListener("visibilitychange",()=>{enforceAudible();if(document.hidden){if(!audio.paused)setStatus("NOW PLAYING");}else{setTimeout(()=>{enforceAudible();syncStatus();},150);}});
window.addEventListener("pageshow",()=>setTimeout(()=>{enforceAudible();syncStatus();},150));
window.addEventListener("focus",()=>setTimeout(()=>{enforceAudible();syncStatus();},150));
miniBtn.onclick=()=>{player.classList.add("mini");save()};
player.querySelector(".topbar").ondblclick=()=>{if(!sheetPopup){player.classList.toggle("mini");save()}};
restoreBtn.onclick=()=>{player.classList.remove("hidden","mini");restoreBtn.style.display="none";save()};
player.querySelector(".topbar").onclick=()=>{if(player.classList.contains("mini")){player.classList.remove("mini");save()}};
resetBtn.onclick=()=>{player.style.left="auto";player.style.top="auto";player.style.right="24px";player.style.bottom="24px";save()};
moveBtn.onclick=()=>{if(isMobile||sheetPopup)return;player.classList.toggle("moveMode");moveBtn.classList.toggle("active")};
let dragging=false,ox=0,oy=0;const handle=player.querySelector(".topbar");
handle.addEventListener("mousedown",e=>{if(isMobile||sheetPopup)return;if(!player.classList.contains("moveMode"))return;if(e.target.tagName==="BUTTON")return;dragging=true;ox=e.clientX-player.offsetLeft;oy=e.clientY-player.offsetTop});
document.addEventListener("mousemove",e=>{if(!dragging)return;player.style.left=(e.clientX-ox)+"px";player.style.top=(e.clientY-oy)+"px";player.style.right="auto";player.style.bottom="auto"});
document.addEventListener("mouseup",()=>{if(dragging){dragging=false;save()}});
drawIdle();loadState();updateLoopButton();updateShuffleButton();loadTrack(0,false);if(shouldAutoplay&&!isMobile)setTimeout(()=>startAudio(),400);
