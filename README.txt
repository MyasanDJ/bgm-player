BGM Player v5.9 Status + Shuffle

改善内容:
1. READY / NOW PLAYING / PAUSED / ENDED / LOAD ERROR の表記を、再生状態と同期するように修正。
2. 再生/停止ボタンとステータスがズレにくいように syncStatus() で一元管理。
3. ランダム再生ボタン 🔀 を追加。
4. ランダム再生はリピートボタンとは別枠。
5. ランダムON時は、曲の終了後に重複ありでランダムに次曲へ進み続けます。

編集する場所:
player.js の playlist だけ編集してください。

const playlist=[
  {src:"track1.mp3", title:"1曲目のタイトル", cover:"cover1.png"},
  {src:"track2.mp3", title:"2曲目のタイトル", cover:"cover2.png"}
];

Apps Script側URL:
https://rimuruby1223.github.io/bgm-player/?sheet=1&popup=1&autoplay=1&v=59

スマホ用URL:
https://rimuruby1223.github.io/bgm-player/?safe=1&v=59
