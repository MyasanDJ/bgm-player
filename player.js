const audio=document.getElementById('audio');
const btn=document.getElementById('play');
btn.addEventListener('click', async ()=>{
  if(audio.paused){
    try{
      await audio.play();
      btn.textContent='⏸ 一時停止';
    }catch(e){
      alert('再生できませんでした。bgm.mp3 が存在するか確認してください。');
    }
  }else{
    audio.pause();
    btn.textContent='▶ 再生';
  }
});
