# JSPatch-Server
practice with node.js

##How to use
### Install packages
```
npm install
```

###MongoDB

### Data Structure

Params | Type | Description 
------ | ---- | --------------
appName | String | name of App 
platform | String | iOS or Android (case-insensitive)
app_version | String | version of App
file | String | the name of the Script file
version | String | the version of the Script file


### Test Data

```
db.relationship.insert({
    appName : "hfs",
     platform : "iOS",
     app_version : "2.0.0",
     file : "patch-ios-2.0.0.js",
     version : 0
},
{
    appName: "AAA",
    platform: "iOS",
    app_version: "2.0.0",
    file: "patch-ios-1.0.0",
    version : 0

},
{
    appName: "AAA",
    platform: "Android",
    app_version: "1.0.0",
    file: "patch-android-1.0.0",
    version : 0
},
{
    appName: "BBB",
    platform: "Android",
    app_version: "2.0.0",
    file: "patch-android-2.0.0",
    version : 0
})
```

### JS Files

Put JS files into `jsfiles` folder

### Security

Put private rsa key (pem) into `pemfile` folder






```
// GET -> Get js file
http://localhost:3000/jspatch?deviceType=iOS&appVersion=2.0.0&appName=hfs

// POST -> Refresh Cache
http://localhost:3000/jspatch

// GET -> Check Version
http://localhost:3000/jspatch/check?deviceType=iOS&appVersion=2.0.0&appName=hfs&localVersion=1.0

```
