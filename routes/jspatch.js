/**
 * Created by jwolf on 2016/9/16.
 */

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var mongoose = require('mongoose');
var config = require('../config');
mongoose.connect('mongodb://localhost/test');
mongoose.set('debug', true);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('mongodb opened');
});

// Schema
var relationshipSchema = mongoose.Schema({
    platform: String,
    version: String,
    file: String
});
var Relation = mongoose.model('Relation', relationshipSchema, 'relationship');

// 缓存
// {"iOS+2.0.0+hfs": fileData1,
//  "Android+1.0.0+yx": fileData2}
var cacheMap = new Map();

var privatePem = fs.readFileSync(config.root + '/pemfiles/private_rsa_pkcs8.pem');
var publicPem = fs.readFileSync(config.root + '/pemfiles/rsa_public_key.pem');
var key = privatePem.toString();
var pubKey = publicPem.toString();

/* GET users listing. */
router.get('/', function(req, res, next) {
    console.log('get called!');
    var deviceType = req.query.deviceType;
    var appVersion = req.query.appVersion;
    var appName = req.query.appName;
    var keyForCache = deviceType+appVersion+appName;
    // 先从缓存中取
    var data = cacheMap.get(keyForCache);
    if (data) {
        res.status(200).send(data);
        console.log('already cached data: \n', data);
        return;
    }
    // 缓存中没有,从数据库中查找
    //noinspection JSAnnotator
    var deviceTypeReg = new RegExp(["^", deviceType, "$"].join(""), "i");
    Relation.find({platform: deviceTypeReg, app_version: appVersion, appName: appName}, function (err, items) {
        if (items.length > 0) {
            var item = items[0];
            var filename = item.file;
            fs.readFile(config.root + '/jsfiles/' + filename, 'utf8', function (err, data) {
                if (err) {
                    // 访问出错返回空字符串
                    res.status(200).send("error");
                    return console.log(err);
                }

                var sign = crypto.createSign('RSA-SHA256');
                var md5data = crypto.createHash('md5').update(data).digest('base64');
                sign.update(md5data);
                var sig = sign.sign(key, 'base64');
                var responseData = {'sig': sig, 'data': data, version: item.version};
                console.log('data: \n', JSON.stringify(responseData));

                // 加入缓存
                // console.log('key:'+key);
                console.log('sig:' + sig);
                var verify = crypto.createVerify('RSA-SHA256');
                var md5data2 = crypto.createHash('md5').update(data).digest('base64');
                verify.update(md5data2);
                // console.log('md5data:'+md5data);
                // console.log('check:'+(md5data===md5data2));
                // console.log('verify: \n', verify.verify(pubKey, sig, 'base64'));
                cacheMap.set(keyForCache, responseData);
                res.status(200).send(responseData);
                return;
            });
        } else {
            res.status(200).send("");
        }
    });
});
router.get('/check', function (req, res, next) {
    console.log('get called!');
    var deviceType = req.query.deviceType;
    var appVersion = req.query.appVersion;
    var appName = req.query.appName;
    var remoteVersion = req.query.localVersion; //the remote Js Version
    var keyForCache = 'version:' + remoteVersion + deviceType + appVersion + appName;
    // 先从缓存中取
    var data = cacheMap.get(keyForCache);
    if (data) {
        res.status(200).send(data);
        console.log('already cached data: \n', data);
        return;
    }
    // 缓存中没有,从数据库中查找
    //noinspection JSAnnotator
    var deviceTypeReg = new RegExp(["^", deviceType, "$"].join(""), "i");
    Relation.find({platform: deviceTypeReg, app_version: appVersion, appName: appName}, function (err, items) {
        if (items.length > 0 && (items[0].version > remoteVersion)) {
            console.log('updateNeed true');
            res.status(200).send({
                updateNeed: 1
            });
        } else {
            console.log('updateNeed false');
            res.status(200).send({
                updateNeed: 0
            });
        }
    });
});
router.post('/', function (req, res, next) {
    cacheMap.clear();
    res.status(200).send("Refresh Succeed");
    return;

    if (req.query.refresh == 1) {
        cacheMap.clear();
        privatePem = fs.readFileSync(config.root + '/pemfiles/my.pem');
        key = privatePem.toString();
        res.status(200).send("Refresh Succeed");
    } else {
        res.status(200).send("");
    }
});

module.exports = router;
