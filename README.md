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

## esaの場合

esaでエクスポートしたZipファイルを解凍（展開）してください。そのパスを `/path/to/exported_dir/` として指定します。

```
$ notepm esa \
  -d ESA_DOMAIN \
  -p /path/to/exported_dir/ \
  -a ACCESS_TOKEN \
  -t NOTE_PM_SUBDOMAIN
```

`ESA_DOMAIN` はesaの利用ドメインです。 notepm.esa.io のように指定します。

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。

## Kibelaの場合

KibelaでエクスポートしたZipファイルを解凍（展開）してください。そのパスを `/path/to/exported_dir/` として指定します。

```
$ notepm kibela \
  -p /path/to/exported_dir/ \
  -a ACCESS_TOKEN \
  -t NOTE_PM_SUBDOMAIN \
  -u PATH_TO_SETTING_YAML
```

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。

`PATH_TO_SETTING_YAML` は Qiita Teamの時と同じ手順で作成したKibelaとNotePMのユーザIDを突合するファイルです。KibelaのユーザIDは @ を付けてください。

```yaml
users:
  -
    id: "@taro"
    name: プロジェクト太郎
    user_code: "0000000001"
  
  -
    id: "@hanako"
    name: プロジェクト花子
    user_code: "0000000002"
```

## DocBaseの場合

DocBaseでエクスポートしたZipファイルを解凍（展開）してください。そのパスを `/path/to/exported_dir/` として指定します。

```
$ notepm docbase \
  -p /path/to/exported_dir/ \
  -a ACCESS_TOKEN \
  -t NOTE_PM_SUBDOMAIN \
  -u PATH_TO_SETTING_YAML
```

`ACCESS_TOKEN` はNotePMで発行したアクセストークンになります。

`NOTE_PM_SUBDOMAIN` はNotePMで利用しているサブドメインになります。たとえば `notepm` です。

`PATH_TO_SETTING_YAML` は Qiita Teamの時と同じ手順で作成したDocBaseとNotePMのユーザIDを突合するファイルです。

## 注意点

- Qiita Teamの場合、実行時にWebブラウザ（Google Chrome）が開きます。あらかじめインストールが必要です。

## npm

[notepm_importer - npm](https://www.npmjs.com/package/notepm_importer)

## LICENSE

MIT.
