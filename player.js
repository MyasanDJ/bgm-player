const audio=document.getElementById("audio");
const play=document.getElementById("play");
const volume=document.getElementById("volume");
const player=document.querySelector(".player");

// 保存済み音量
const saved=localStorage.getItem("volume");

if(saved){

volume.value=saved;

audio.volume=saved/100;

}else{

audio.volume=0.5;

}

volume.oninput=()=>{

audio.volume=volume.value/100;

localStorage.setItem("volume",volume.value);

};

play.onclick=async()=>{

if(audio.paused){

await audio.play();

play.innerHTML="⏸ 停止";

player.classList.add("playing");

}else{

audio.pause();

play.innerHTML="▶ 再生";

player.classList.remove("playing");

}

};

audio.onended=()=>{

player.classList.remove("playing");

play.innerHTML="▶ 再生";

};

// ===== ビジュアライザー =====

const bars=document.querySelectorAll(".visualizer span");

let timer;

function startVisualizer(){

timer=setInterval(()=>{

bars.forEach(bar=>{

bar.style.height=(5+Math.random()*30)+"px";

});

},120);

}

function stopVisualizer(){

clearInterval(timer);

bars.forEach(bar=>{

bar.style.height="8px";

});

}

// ===== コンパクト =====

const mini=document.getElementById("mini");

mini.onclick=()=>{

player.classList.toggle("mini");

};

// ===== ドラッグ =====

let drag=false;

let x=0;

let y=0;

player.style.position="fixed";

player.style.right="20px";

player.style.bottom="20px";

player.onmousedown=e=>{

drag=true;

x=e.offsetX;

y=e.offsetY;

};

document.onmouseup=()=>drag=false;

document.onmousemove=e=>{

if(!drag)return;

player.style.left=e.pageX-x+"px";

player.style.top=e.pageY-y+"px";

player.style.right="auto";

player.style.bottom="auto";

};
