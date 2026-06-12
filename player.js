const cover=document.getElementById("coverImg");

cover.onerror=()=>{

    cover.src="cover.jpg";

    cover.onerror=()=>{

        cover.style.display="none";

    };

};
const player=document.getElementById("player");
const audio=document.getElementById("audio");
const play=document.getElementById("play");
const volume=document.getElementById("volume");
const volText=document.getElementById("volText");
const seek=document.getElementById("seek");
const current=document.getElementById("current");
const duration=document.getElementById("duration");
const loopBtn=document.getElementById("loop");
const mute=document.getElementById("mute");
const miniBtn=document.getElementById("miniBtn");
const closeBtn=document.getElementById("closeBtn");
const title=document.getElementById("title");
const canvas=document.getElementById("visualizer");
const ctx=canvas.getContext("2d");

let audioCtx, analyser, source, dataArray, raf;
let lastVolume=0.5;

function fmt(sec){
  if(!isFinite(sec)) return "0:00";
  const m=Math.floor(sec/60);
  const s=Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}
function save(){localStorage.setItem("bgmState",JSON.stringify({
  volume:audio.volume, muted:audio.muted, mini:player.classList.contains("mini"),
  left:player.style.left, top:player.style.top, right:player.style.right, bottom:player.style.bottom
}))}
function load(){
  try{
    const s=JSON.parse(localStorage.getItem("bgmState")||"{}");
    if(typeof s.volume==="number"){audio.volume=s.volume;volume.value=Math.round(s.volume*100);volText.textContent=volume.value+"%"}
    if(s.muted){audio.muted=true;mute.textContent="🔇"}
    if(s.mini)player.classList.add("mini");
    if(s.left){player.style.left=s.left;player.style.top=s.top;player.style.right="auto";player.style.bottom="auto"}
  }catch(e){}
}
load();

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
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bars=42,w=canvas.width/bars;
  for(let i=0;i<bars;i++){
    const v=dataArray[i]||0;
    const h=Math.max(4,(v/255)*canvas.height*.9);
    const g=ctx.createLinearGradient(0,canvas.height-h,0,canvas.height);
    g.addColorStop(0,"#b468ff");g.addColorStop(.45,"#42d8ff");g.addColorStop(1,"#1766ff");
    ctx.fillStyle=g;
    ctx.shadowColor="#55dfff";ctx.shadowBlur=8;
    ctx.fillRect(i*w+2,canvas.height-h-4,w-4,h);
  }
}
drawIdle();

play.onclick=async()=>{
  if(audio.paused){
    setupAudio();
    if(audioCtx.state==="suspended") await audioCtx.resume();
    await audio.play();
  }else{
    audio.pause();
  }
};
audio.onplay=()=>{
  play.textContent="⏸";
  player.classList.add("playing");
  cancelAnimationFrame(raf);
  if(analyser) draw();
};
audio.onpause=()=>{
  play.textContent="▶";
  player.classList.remove("playing");
  cancelAnimationFrame(raf);
  drawIdle();
};
audio.onloadedmetadata=()=>{
  seek.max=audio.duration||0;
  duration.textContent=fmt(audio.duration);
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
loopBtn.onclick=()=>{
  audio.loop=!audio.loop;
  loopBtn.classList.toggle("active",audio.loop);
};
mute.onclick=()=>{
  audio.muted=!audio.muted;
  mute.textContent=audio.muted?"🔇":"🔊";
  save();
};
miniBtn.onclick=()=>{player.classList.toggle("mini");save()};
player.querySelector(".topbar").ondblclick=()=>{player.classList.toggle("mini");save()};
closeBtn.onclick=()=>window.close();

document.querySelectorAll(".playlist button").forEach(btn=>{
  btn.onclick=()=>{
    audio.pause();
    audio.innerHTML=`<source src="${btn.dataset.src}" type="${btn.dataset.type}">`;
    audio.load();
    title.textContent=btn.dataset.src;
  };
});

let dragging=false,ox=0,oy=0;
const handle=document.getElementById("dragHandle");
handle.addEventListener("mousedown",e=>{
  if(e.target.tagName==="BUTTON")return;
  dragging=true;ox=e.clientX-player.offsetLeft;oy=e.clientY-player.offsetTop;
});
document.addEventListener("mousemove",e=>{
  if(!dragging)return;
  player.style.left=(e.clientX-ox)+"px";
  player.style.top=(e.clientY-oy)+"px";
  player.style.right="auto";player.style.bottom="auto";
});
document.addEventListener("mouseup",()=>{if(dragging){dragging=false;save()}});
