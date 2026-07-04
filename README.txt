BGM Player v6.0 Background Media Session

追加内容:
- バックグラウンド移行時に自動停止する処理を削除しました。
- Media Session API を追加しました。
  - ロック画面/通知領域の再生・停止・前曲・次曲・シーク操作に対応しやすくなります。
  - 曲名、アーティスト名、ジャケットを端末側に渡します。
- Wake Lock API を追加しました。
  - 対応ブラウザでは画面スリープを抑制します。

重要:
- Javaではなく、Webページ上で動くJavaScriptの修正版です。
- iPhone/AndroidのOSやブラウザがバックグラウンド再生を制限する場合、コードだけで完全強制はできません。
- Braveなどではブラウザ側のBackground Audio設定をONにしてください。
- スマホで検証するときは safe=1 を外してください。

編集する場所:
player.js の playlist だけ編集してください。

const playlist=[
  {src:"track1.mp3", title:"1曲目のタイトル", cover:"cover1.png"},
  {src:"track2.mp3", title:"2曲目のタイトル", cover:"cover2.png"}
];

PC Apps Script側URL:
https://myasandj.github.io/bgm-player/?sheet=1&popup=1&autoplay=1&v=60

スマホ/Brave検証用URL:
https://myasandj.github.io/bgm-player/?v=60
