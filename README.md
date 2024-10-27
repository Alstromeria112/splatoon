<div id="top"></div>

# Discord-Bot

## 準備
Node.jsで使用するパッケージをインストール後、DiscordBotにスラッシュコマンドを登録
```
npm install
npm run pushcommands 
```
※`package.json`が存在するディレクトリで実行
※`.env`を設定後に実行

## 実行
```
npm start
```

## 設定
`.env.sample`を`.env`に名称変更
```
TOKEN="AAABBBCCCDDD"
CLIENT_ID="1234"
OWNER_ID="782142078464425995"
MAINTAINERS_ID="1234"
PREFIX="!"
ICON_URL="https://cdn.discordapp.com/embed/avatars/0.png"
POWERED="Powered by Discord Bot"
SUCCESS="✅ SUCCESS ✅"
ERROR="❌ ERROR ❌"
```
| 項目 | 内容・説明                                                                 |
| -------------- | ---------------------------------------------------------------- |
| TOKEN          | DiscordBotのトークンを記入                                        |
| CLIENT_ID      | DiscordBotのクライアントIDを記入                                  |
| OWNER_ID       | DiscordBotのオーナーIDを記入                                      |
| MAINTAINERS_ID | オーナー以外にreloadコマンドなどを実行可能にさせるユーザーIDを記入 |
| PREFIX         | メッセージコマンドを使用する際の接頭語を記入                       |
| ICON_URL       | EmbedのFooterアイコンに使用するURLを記入                          |
| POWERED        | EmbedのFooterに使用する文字列を記入                               |
| SUCCESS        | コマンドの実行成功時に出力される文字列を記入                       |
| ERROR          | コマンドの実行時にエラーが発生した場合に出力される文字列を記入     |

## コマンドリスト

### スラッシュコマンド
| コマンド名 | 内容・説明                             |
| ---------- | --------------------------------------- |
| ping       | Pingを表示                              |
| reload     | Botを再読み込み                         |
| play       | 曲を再生                                | 
| stop       | 曲を停止                                |
| pause      | 曲を一時停止                            |
| unpause    | 曲の一時停止解除                        |
| skip       | 曲を一曲スキップ                        |
| loop queue | キュー内の曲を繰り返し再生(試験的)      |
| shuffle    | キュー内の曲をランダム再生              |
| unshuffle  | ランダム化したキューを元に(試験的)      |
| queue list | キュー内に入っている曲をリストアップ    |
| volume set | 音量を設定(0~100(デフォルト=5))(試験的) |

### メッセージコマンド
| 接頭語+α |   内容・説明   |
| -------- | --------------- |
| ping     | Pingを表示      |
| reload   | Botを再読み込み |

## ライセンス(仮)
MIT License
