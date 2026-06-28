const params=new URLSearchParams(location.search);
const sheetPopup=params.get("sheet")==="1" || params.get("popup")==="1";
const safeMode=params.get("safe")==="1";
const shouldAutoplay=params.get("autoplay")==="1";
const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if(isMobile){document.documentElement.classList.add("mobile");document.body.classList.add("mobile")}
if(sheetPopup)document.body.classList.add("sheetPopup");

const player=document.getElementById("player"),restoreBtn=document.getElementById("restoreBtn"),audio=document.getElementById("audio");
const play=document.getElementById("play"),prevBtn=document.getElementById("prev"),nextBtn=document.getElementById("next"),volume=document.getElementById("volume"),volText=document.getElementById("volText"),seek=document.getElementById("seek"),current=document.getElementById("current"),duration=document.getElementById("duration"),loopBtn=document.getElementById("loop"),shuffleBtn=document.getElementById("shuffle"),mute=document.getElementById("mute"),miniBtn=document.getElementById("miniBtn"),resetBtn=document.getElementById("resetBtn"),moveBtn=document.getElementById("moveBtn"),songTitle=document.getElementById("songTitle"),trackInfo=document.getElementById("trackInfo"),statusText=document.getElementById("statusText"),canvas=document.getElementById("visualizer"),ctx=canvas.getContext("2d"),coverImg=document.getElementById("coverImg");

// ★ここだけ編集してください。
const playlist=[
  {src:"track1.mp3", title:"#あくあ色ぱれっと", cover:"cover1.jpg"},
  {src:"track2.mp3", title:"海想列車", cover:"cover2.jpg"},
  {src:"track3.mp3", title:"墓A・RA・SHI", cover:"cover3.png"},
  {src:"track4.mp3", title:"Howling", cover:"cover4.jpg"},
  {src:"track5.mp3", title:"KON KON Beats", cover:"cover7.png"},
  {src:"track6.mp3", title:"KON KON Beats by Mio", cover:"cover6.png"},
  {src:"track7.mp3", title:"フブミオBeats", cover:"cover8.png"},
  {src:"track8.mp3", title:"グローエンブレイス", cover:"cover5.jpg"},
  {src:"track9.mp3", title:"大切フォトグラフ", cover:"cover9.jpeg"}
];

let audioCtx,analyser,source,dataArray,raf;
let currentIndex=0,mode="all",shuffleMode=false,lastStatus="READY";
function guessType(src){const s=src.toLowerCase();if(s.endsWith(".mp3"))return"audio/mpeg";if(s.endsWith(".m4a"))return"audio/mp4";if(s.endsWith(".wav"))return"audio/wav";return""}
function setStatus(t){lastStatus=t;statusText.textContent=t}
function syncStatus(){
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
function randomIndex(){return Math.floor(Math.random()*playlist.length)}
function randomIndexAvoidCurrent(){if(playlist.length<=1)return 0;let n=currentIndex,g=0;while(n===currentIndex&&g<10){n=randomIndex();g++}return n}
function nextTrack(autoplay=true){
  if(!playlist.length)return;
  if(shuffleMode){loadTrack(randomIndexAvoidCurrent(),autoplay);return}
  if(currentIndex>=playlist.length-1){if(mode==="none"){setStatus("ENDED");syncStatus();return}loadTrack(0,autoplay);return}
  loadTrack(currentIndex+1,autoplay);
}
function prevTrack(){if(!playlist.length)return;if(audio.currentTime>3){audio.currentTime=0;return}if(shuffleMode){loadTrack(randomIndex(),true);return}loadTrack(currentIndex-1,true)}
function fmt(sec){if(!isFinite(sec))return"0:00";const m=Math.floor(sec/60),s=Math.floor(sec%60).toString().padStart(2,"0");return`${m}:${s}`}
function save(){if(sheetPopup)return;localStorage.setItem("bgmState",JSON.stringify({volume:audio.volume,muted:audio.muted,mini:player.classList.contains("mini"),hidden:player.classList.contains("hidden"),left:player.style.left,top:player.style.top,mode,shuffleMode}))}
function loadState(){if(sheetPopup)return;try{const s=JSON.parse(localStorage.getItem("bgmState")||"{}");if(typeof s.volume==="number"&&!isMobile){audio.volume=s.volume;volume.value=Math.round(s.volume*100);volText.textContent=volume.value+"%"}if(s.muted&&!isMobile){audio.muted=true;mute.textContent="🔇"}if(["all","one","none"].includes(s.mode))mode=s.mode;if(typeof s.shuffleMode==="boolean")shuffleMode=s.shuffleMode;updateLoopButton();updateShuffleButton();if(s.mini)player.classList.add("mini");if(s.hidden&&!isMobile){player.classList.add("hidden");restoreBtn.style.display="block"}if(s.left&&!isMobile){player.style.left=s.left;player.style.top=s.top;player.style.right="auto";player.style.bottom="auto"}}catch(e){}}
function setupAudio(){if(audioCtx)return;audioCtx=new (window.AudioContext||window.webkitAudioContext)();analyser=audioCtx.createAnalyser();analyser.fftSize=128;dataArray=new Uint8Array(analyser.frequencyBinCount);source=audioCtx.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioCtx.destination)}
function drawIdle(){ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<36;i++){const h=8+Math.sin(i*.7)*5;ctx.fillStyle="rgba(90,220,255,.45)";ctx.fillRect(i*7+5,canvas.height-h-8,4,h)}}
function draw(){raf=requestAnimationFrame(draw);if(!analyser)return;analyser.getByteFrequencyData(dataArray);ctx.clearRect(0,0,canvas.width,canvas.height);const bars=42,w=canvas.width/bars;for(let i=0;i<bars;i++){const v=dataArray[i]||0,h=Math.max(4,(v/255)*canvas.height*.9),g=ctx.createLinearGradient(0,canvas.height-h,0,canvas.height);g.addColorStop(0,"#b468ff");g.addColorStop(.45,"#42d8ff");g.addColorStop(1,"#1766ff");ctx.fillStyle=g;ctx.shadowColor="#55dfff";ctx.shadowBlur=8;ctx.fillRect(i*w+2,canvas.height-h-4,w-4,h)}}
async function startAudio(){if(!playlist.length){syncStatus();return}setupAudio();if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();try{await audio.play();syncStatus()}catch(e){setStatus("TAP AGAIN");console.log(e)}}
function updateLoopButton(){loopBtn.classList.toggle("active",mode!=="none");if(mode==="all"){loopBtn.textContent="🔁";loopBtn.title="全曲ループ"}if(mode==="one"){loopBtn.textContent="🔂";loopBtn.title="1曲ループ"}if(mode==="none"){loopBtn.textContent="➡️";loopBtn.title="流しきり"}}
function updateShuffleButton(){shuffleBtn.classList.toggle("active",shuffleMode);shuffleBtn.title=shuffleMode?"ランダム再生ON":"ランダム再生OFF"}
play.onclick=async()=>{if(audio.paused)await startAudio();else audio.pause()};
prevBtn.onclick=()=>prevTrack();nextBtn.onclick=()=>nextTrack(true);
loopBtn.onclick=()=>{if(mode==="all")mode="one";else if(mode==="one")mode="none";else mode="all";updateLoopButton();save()};
shuffleBtn.onclick=()=>{shuffleMode=!shuffleMode;updateShuffleButton();save()};
mute.onclick=()=>{audio.muted=!audio.muted;mute.textContent=audio.muted?"🔇":"🔊";save()};
audio.addEventListener("play",()=>{syncStatus();cancelAnimationFrame(raf);draw()});
audio.addEventListener("pause",()=>{syncStatus();cancelAnimationFrame(raf);drawIdle()});
audio.addEventListener("ended",()=>{if(mode==="one"){audio.currentTime=0;startAudio();return}if(shuffleMode){loadTrack(randomIndex(),true);return}if(mode==="all"){nextTrack(true);return}if(currentIndex<playlist.length-1)loadTrack(currentIndex+1,true);else{setStatus("ENDED");syncStatus()}});
audio.addEventListener("error",()=>{setStatus("LOAD ERROR");syncStatus()});
audio.onloadedmetadata=()=>{seek.max=audio.duration||0;duration.textContent=fmt(audio.duration);if(audio.paused)setStatus("READY")};
audio.ontimeupdate=()=>{seek.value=audio.currentTime||0;current.textContent=fmt(audio.currentTime)};
seek.oninput=()=>audio.currentTime=seek.value;
volume.oninput=()=>{audio.volume=volume.value/100;audio.muted=false;mute.textContent="🔊";volText.textContent=volume.value+"%";save()};
document.addEventListener("visibilitychange",()=>{if(isMobile||safeMode){if(document.hidden){if(!audio.paused){audio.pause();setStatus("PAUSED")}if(audioCtx&&audioCtx.state==="running")audioCtx.suspend().catch(()=>{})}else syncStatus()}});
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
