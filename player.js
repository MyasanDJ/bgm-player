const songTitle = document.getElementById("songTitle");
1:"#あくあ色ぱれっと"
2:"海想列車"
3:"墓A・RA・SHI"
4:"Howling"


const params=new URLSearchParams(location.search);
const sheetPopup=params.get("sheet")==="1" || params.get("popup")==="1";
const safeMode=params.get("safe")==="1";
const shouldAutoplay=params.get("autoplay")==="1";
const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if(isMobile){document.documentElement.classList.add("mobile");document.body.classList.add("mobile")}
if(sheetPopup)document.body.classList.add("sheetPopup");
const player=document.getElementById("player"),restoreBtn=document.getElementById("restoreBtn"),audio=document.getElementById("audio");
const play=document.getElementById("play"),prevBtn=document.getElementById("prev"),nextBtn=document.getElementById("next"),volume=document.getElementById("volume"),volText=document.getElementById("volText"),seek=document.getElementById("seek"),current=document.getElementById("current"),duration=document.getElementById("duration"),loopBtn=document.getElementById("loop"),mute=document.getElementById("mute"),miniBtn=document.getElementById("miniBtn"),resetBtn=document.getElementById("resetBtn"),moveBtn=document.getElementById("moveBtn"),title=document.getElementById("title"),trackInfo=document.getElementById("trackInfo"),statusText=document.getElementById("statusText"),canvas=document.getElementById("visualizer"),ctx=canvas.getContext("2d"),coverImg=document.getElementById("coverImg");
const defaultTitle=player.dataset.trackTitle||"BGM";
const EXT=[{ext:"mp3",type:"audio/mpeg"},{ext:"m4a",type:"audio/mp4"},{ext:"wav",type:"audio/wav"},{ext:"wav",type:"audio/x-wav"}];
let trackNo=1, extNo=0, mode="all", loading=false, userStarted=false, usingBgm=false;
let audioCtx,analyser,source,dataArray,raf;
function candidate(){if(usingBgm){return [{src:"bgm.mp3",type:"audio/mpeg"},{src:"bgm.m4a",type:"audio/mp4"},{src:"bgm.wav",type:"audio/wav"},{src:"bgm.wav",type:"audio/x-wav"}][extNo]} const e=EXT[extNo]; return e?{src:`track${trackNo}.${e.ext}`,type:e.type}:null}
function setSource(c){audio.innerHTML=`<source src="${c.src}" type="${c.type}">`;audio.load()}
function updateText(){title.textContent=usingBgm?defaultTitle:`Track ${trackNo}`;trackInfo.textContent=usingBgm?"BGM":`TRACK ${trackNo}`}
async function loadCover(){coverImg.style.display="none";const bases=usingBgm?["cover"]:[`cover${trackNo}`,"cover"];for(const b of bases){for(const e of ["png","jpg","jpeg"]){const src=`${b}.${e}`;const ok=await fetch(src,{method:"HEAD",cache:"no-store"}).then(r=>r.ok).catch(()=>false);if(ok){coverImg.src=src;coverImg.onload=()=>coverImg.style.display="block";coverImg.onerror=()=>coverImg.style.display="none";return}}}}
function loadTrack(n,autoplay=true){loading=true;usingBgm=false;trackNo=Math.max(1,n);extNo=0;updateText();loadCover();tryCandidate(autoplay)}
function loadBgm(autoplay=true){loading=true;usingBgm=true;extNo=0;updateText();loadCover();tryCandidate(autoplay)}
function tryCandidate(autoplay=true){const c=candidate();if(!c){if(usingBgm){statusText.textContent="NO AUDIO";loading=false;return} if(trackNo===1){loadBgm(autoplay);return} if(mode==="all")loadTrack(1,autoplay);else{statusText.textContent="NO NEXT";loading=false}return}statusText.textContent="LOADING";setSource(c);if(autoplay)setTimeout(()=>startAudio(),140)}
function nextTrack(autoplay=true){if(usingBgm){loadTrack(1,autoplay);return}loadTrack(trackNo+1,autoplay)}
function prevTrack(){if(audio.currentTime>3){audio.currentTime=0;return}loadTrack(Math.max(1,trackNo-1),true)}
function fmt(sec){if(!isFinite(sec))return"0:00";return Math.floor(sec/60)+":"+Math.floor(sec%60).toString().padStart(2,"0")}
function save(){if(sheetPopup)return;localStorage.setItem("bgmState",JSON.stringify({volume:audio.volume,muted:audio.muted,mini:player.classList.contains("mini"),hidden:player.classList.contains("hidden"),left:player.style.left,top:player.style.top,mode}))}
function loadState(){if(sheetPopup)return;try{const s=JSON.parse(localStorage.getItem("bgmState")||"{}");if(typeof s.volume==="number"&&!isMobile){audio.volume=s.volume;volume.value=Math.round(s.volume*100);volText.textContent=volume.value+"%"}if(s.muted&&!isMobile){audio.muted=true;mute.textContent="🔇"}if(["all","one","none"].includes(s.mode))mode=s.mode;updateLoop();if(s.mini)player.classList.add("mini");if(s.hidden&&!isMobile){player.classList.add("hidden");restoreBtn.style.display="block"}if(s.left&&!isMobile){player.style.left=s.left;player.style.top=s.top;player.style.right="auto";player.style.bottom="auto"}}catch(e){}}
function setupAudio(){if(audioCtx)return;audioCtx=new (window.AudioContext||window.webkitAudioContext)();analyser=audioCtx.createAnalyser();analyser.fftSize=128;dataArray=new Uint8Array(analyser.frequencyBinCount);source=audioCtx.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioCtx.destination)}
function drawIdle(){ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<36;i++){const h=8+Math.sin(i*.7)*5;ctx.fillStyle="rgba(90,220,255,.45)";ctx.fillRect(i*7+5,canvas.height-h-8,4,h)}}
function draw(){raf=requestAnimationFrame(draw);if(!analyser)return;analyser.getByteFrequencyData(dataArray);ctx.clearRect(0,0,canvas.width,canvas.height);const bars=42,w=canvas.width/bars;for(let i=0;i<bars;i++){const v=dataArray[i]||0,h=Math.max(4,(v/255)*canvas.height*.9),g=ctx.createLinearGradient(0,canvas.height-h,0,canvas.height);g.addColorStop(0,"#b468ff");g.addColorStop(.45,"#42d8ff");g.addColorStop(1,"#1766ff");ctx.fillStyle=g;ctx.shadowColor="#55dfff";ctx.shadowBlur=8;ctx.fillRect(i*w+2,canvas.height-h-4,w-4,h)}}
async function startAudio(){userStarted=true;setupAudio();if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();try{await audio.play()}catch(e){statusText.textContent="TAP AGAIN";console.log(e)}}
function updateLoop(){loopBtn.classList.toggle("active",mode!=="none");if(mode==="all"){loopBtn.textContent="🔁";loopBtn.title="全曲ループ"}if(mode==="one"){loopBtn.textContent="🔂";loopBtn.title="1曲ループ"}if(mode==="none"){loopBtn.textContent="➡️";loopBtn.title="ループなし"}}
play.onclick=async()=>{if(audio.paused)await startAudio();else audio.pause()}; prevBtn.onclick=()=>prevTrack(); nextBtn.onclick=()=>nextTrack(true);
loopBtn.onclick=()=>{mode=mode==="all"?"one":mode==="one"?"none":"all";updateLoop();save()}; mute.onclick=()=>{audio.muted=!audio.muted;mute.textContent=audio.muted?"🔇":"🔊";save()};
audio.addEventListener("play",async()=>{loading=false;setupAudio();if(audioCtx&&audioCtx.state==="suspended")await audioCtx.resume();play.textContent="⏸";statusText.textContent="NOW PLAYING";player.classList.add("playing");cancelAnimationFrame(raf);draw()});
audio.addEventListener("pause",()=>{play.textContent="▶";player.classList.remove("playing");cancelAnimationFrame(raf);drawIdle()});
audio.addEventListener("ended",()=>{if(mode==="one"){audio.currentTime=0;startAudio()}else if(mode==="all")nextTrack(true);else statusText.textContent="ENDED"});
audio.addEventListener("error",()=>{if(!loading&&!userStarted)return;extNo++;if(candidate()){tryCandidate(userStarted);return}if(usingBgm){statusText.textContent="NO AUDIO";loading=false;return}if(trackNo===1){loadBgm(userStarted);return}if(mode==="all")loadTrack(1,userStarted);else{statusText.textContent="NO NEXT";loading=false}});
audio.onloadedmetadata=()=>{seek.max=audio.duration||0;duration.textContent=fmt(audio.duration);statusText.textContent="READY"}; audio.ontimeupdate=()=>{seek.value=audio.currentTime||0;current.textContent=fmt(audio.currentTime)};
seek.oninput=()=>audio.currentTime=seek.value; volume.oninput=()=>{audio.volume=volume.value/100;audio.muted=false;mute.textContent="🔊";volText.textContent=volume.value+"%";save()};
document.addEventListener("visibilitychange",()=>{if(isMobile||safeMode){if(document.hidden){if(!audio.paused){audio.pause();statusText.textContent="PAUSED"}if(audioCtx&&audioCtx.state==="running")audioCtx.suspend().catch(()=>{})}else{play.textContent="▶";player.classList.remove("playing");statusText.textContent="TAP PLAY"}}});
miniBtn.onclick=()=>{player.classList.add("mini");save()}; player.querySelector(".topbar").ondblclick=()=>{if(!sheetPopup){player.classList.toggle("mini");save()}}; restoreBtn.onclick=()=>{player.classList.remove("hidden","mini");restoreBtn.style.display="none";save()}; player.querySelector(".topbar").onclick=()=>{if(player.classList.contains("mini")){player.classList.remove("mini");save()}}; resetBtn.onclick=()=>{player.style.left="auto";player.style.top="auto";player.style.right="24px";player.style.bottom="24px";save()}; moveBtn.onclick=()=>{if(isMobile||sheetPopup)return;player.classList.toggle("moveMode");moveBtn.classList.toggle("active")};
let dragging=false,ox=0,oy=0;const handle=player.querySelector(".topbar");handle.addEventListener("mousedown",e=>{if(isMobile||sheetPopup)return;if(!player.classList.contains("moveMode"))return;if(e.target.tagName==="BUTTON")return;dragging=true;ox=e.clientX-player.offsetLeft;oy=e.clientY-player.offsetTop});document.addEventListener("mousemove",e=>{if(!dragging)return;player.style.left=(e.clientX-ox)+"px";player.style.top=(e.clientY-oy)+"px";player.style.right="auto";player.style.bottom="auto"});document.addEventListener("mouseup",()=>{if(dragging){dragging=false;save()}});
drawIdle();loadState();loadTrack(1,false);if(shouldAutoplay&&!isMobile)setTimeout(()=>startAudio(),400);
