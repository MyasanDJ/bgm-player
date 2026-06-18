BGM Player v5.8 Explicit Playlist

今回のバグ対策版です。

maxTracks / totalTracks 方式をやめて、playlist 配列だけを編集する方式にしました。
これで「存在しない track3 に進む」「曲名だけ空になる」ズレを防ぎます。

player.js で編集する場所:

const playlist=[
  {src:"track1.mp3", title:"1曲目のタイトル", cover:"cover1.png"},
  {src:"track2.mp3", title:"2曲目のタイトル", cover:"cover2.png"}
];

3曲なら1行追加:
  {src:"track3.mp3", title:"3曲目のタイトル", cover:"cover3.png"}

2曲なら2行だけでOKです。
最後の曲の次は自動で1曲目に戻ります。

Apps Script側URL:
https://rimuruby1223.github.io/bgm-player/?sheet=1&popup=1&autoplay=1&v=58

スマホ用URL:
https://rimuruby1223.github.io/bgm-player/?safe=1&v=58
