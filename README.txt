BGM Player v5.5 Title Main Playlist

曲名を大きく、トラック番号を小さく表示する版です。

表示:
1曲目のタイトル
TRACK 1

曲名を変える場所:
player.js のこの部分を書き換えてください。

const songTitles={
  1:"1曲目のタイトル",
  2:"2曲目のタイトル",
  3:"3曲目のタイトル",
  4:"4曲目のタイトル",
  5:"5曲目のタイトル"
};

音源:
track1.mp3
track2.mp3
track3.mp3

M4A/WAV:
track1.m4a
track2.wav
track3.mp3

曲ごとのジャケット:
cover1.png
cover2.png
cover3.png

共通ジャケット:
cover.png
cover.jpg
cover.jpeg

Apps Script側URL:
https://rimuruby1223.github.io/bgm-player/?sheet=1&popup=1&autoplay=1&v=55

スマホ用URL:
https://rimuruby1223.github.io/bgm-player/?safe=1&v=55


v5.6 変更点:
- 次のトラックが存在しない場合、ループ設定に関係なく track1 に戻るようにしました。
- 例: track1.mp3 / track2.mp3 だけ置いている状態で track3 が無い場合、track2 終了後に track1 へ戻ります。
- ⏭ で存在しない次曲へ送った場合も track1 に戻ります。

Apps Script側URL:
https://rimuruby1223.github.io/bgm-player/?sheet=1&popup=1&autoplay=1&v=56

スマホ用URL:
https://rimuruby1223.github.io/bgm-player/?safe=1&v=56


v5.7 変更点:
- 存在しない track3 などへ進まないように、曲数指定方式に変更しました。
- player.js の const totalTracks=2; を、実際に入れている曲数に合わせて変更してください。
- 例: track1.mp3 / track2.mp3 の2曲だけなら 2。
- 例: track1.mp3 / track2.mp3 / track3.mp3 の3曲なら 3。
- 最後の曲の次は、存在確認を待たずに即 track1 に戻ります。

Apps Script側URL:
https://rimuruby1223.github.io/bgm-player/?sheet=1&popup=1&autoplay=1&v=57

スマホ用URL:
https://rimuruby1223.github.io/bgm-player/?safe=1&v=57
