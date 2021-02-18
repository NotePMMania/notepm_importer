# 各種ドキュメント共有サービスからnotePMへ移行するスクリプト

## インストール

```
npm i notepm_importer -g
```

## Qiita Teamの場合

Qiita TeamでエクスポートしたZipファイルを解凍（展開）してください。そのパスを `/path/to/exported_dir/` として指定します。

```
$ notepm qiita \
  -d YOUR_DOMAIN.qiita.com
  -p /path/to/exported_dir/
  -a ACCESS_TOKEN
  -t NOTE_PM_SUBDOMAIN
  -u SETTING_YAML
```

`SETTING_YAML` はQiitaのユーザIDとnotePM側のユーザ情報を引き当てるためのYAMLファイルです。次のような形です。

```yaml
users:
  -
    id: qiita_id1
    name: User Name1
    user_code: notePM_User_Code1
  - 
    id: qiita_id2
    name: User Name2
    user_code: notePM_User_Code2
```

`YOUR_DOMAIN.qiita.com` はQiita Teamの利用ドメインです。 notepm.qiita.com のように指定します。

`ACCESS_TOKEN` はnotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はnotePMで利用しているサブドメインになります。たとえば `notepm` です。

### 注意点

- 実行時にWebブラウザ（Google Chrome）が開きます。あらかじめインストールが必要です。
- Google Chromeが開いたら、Qiita Teamにログインしてください。ログイン情報を取得するようなことはしていませんのでご安心ください。
- Qiita Teamにアップロードした画像はすべて（ページ内で使われているもののみ）ダウンロードし、notePMへ移行します。
- 添付ファイルは移行できません。ご注意ください。
- プロジェクト内のコンテンツはプロジェクトというノート内に作成されます
- グループが指定されているコンテンツはグループ名でノートを作成し、その中に作成されます
- グループが指定されていないコンテンツはQiita::Teamからのインポート用というノートの中に作成されます
- ノートはすべてプライベートで作成されます

## LICENSE

MIT.
