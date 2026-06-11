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
