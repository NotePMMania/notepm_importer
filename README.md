# 各種ドキュメント共有サービスからNotePMへ移行するスクリプト

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

`SETTING_YAML` はQiitaのユーザIDとNotePM側のユーザ情報を引き当てるためのYAMLファイルです。次のような形です。

```yaml
users:
  -
    id: qiita_id1
    name: User Name1
    user_code: NotePM_User_Code1
  - 
    id: qiita_id2
    name: User Name2
    user_code: NotePM_User_Code2
```

`YOUR_DOMAIN.qiita.com` はQiita Teamの利用ドメインです。 notepm.qiita.com のように指定します。

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。

### 注意点

- 実行時にWebブラウザ（Google Chrome）が開きます。あらかじめインストールが必要です。
- Google Chromeが開いたら、Qiita Teamにログインしてください。ログイン情報を取得するようなことはしていませんのでご安心ください。
- Qiita Teamにアップロードした画像はすべて（ページ内で使われているもののみ）ダウンロードし、NotePMへ移行します。
- 添付ファイルは移行できません。ご注意ください。
- プロジェクト内のコンテンツはプロジェクトというノート内に作成されます
- グループが指定されているコンテンツはグループ名でノートを作成し、その中に作成されます
- グループが指定されていないコンテンツはQiita::Teamからのインポート用というノートの中に作成されます
- ノートはすべてプライベートで作成されます

## フォルダを指定して取り込む場合

任意のフォルダ以下にあるファイルを取り込めます。インポート対象のディレクトリを `/path/to/import_dir/` で指定してください。

```
$ notepm file \
  -p /path/to/import_dir/
  -a ACCESS_TOKEN
  -t NOTE_PM_SUBDOMAIN
```

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。

## CSVファイルからの取り込み

CSVファイルを指定して取り込めます。対象のCSVファイルを `/path/to/csv_file` で指定してください。

```
$ notepm csv \
  -p /path/to/csv_file
  -a ACCESS_TOKEN
  -t NOTE_PM_SUBDOMAIN
```

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。

## ワードファイルの取り込む

Wordファイルの入っているフォルダを指定して取り込めます。インポート対象のディレクトリを `/path/to/import_dir/` で指定してください。

```
$ notepm word \
  -p /path/to/import_dir/
  -a ACCESS_TOKEN
  -t NOTE_PM_SUBDOMAIN
```

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。


## npm

[notepm_importer - npm](https://www.npmjs.com/package/notepm_importer)

## LICENSE

MIT.
