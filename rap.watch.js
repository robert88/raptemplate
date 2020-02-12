const wake = require("@/lib/rap.filesystem.js");
const fs = require("fs");
require("@/lib/rap.color.js");
require("@/lib/rap.timeout.js");
const domain = require('domain');
//全局存储，避免无法清除
 watchCache = global.watchCache||{};
/**
 *
 * 添加监听文件
 */
// persistent 指示只要正在监视文件，进程是否应继续运行。recursive指示是应该监视所有子目录，还是仅监视当前目录。

var timer;
var addWatchLock;//防止死循环
var changeMsg = [];
var watchCallback = {};
var count = 0;
function addWatch(orgDir,callback){
    
    if(addWatchLock){return}
    addWatchLock = true;
    orgDir = orgDir.replace(/(\/|\\)+/g,"/").replace(/(\/|\\)$/,"");
     if(wake.isExist(orgDir) && wake.isDir(orgDir)){
        watchCallback[orgDir] = watchCallback[orgDir]||[];
        watchCallback[orgDir].push(callback);
         bindWatch(orgDir);
     }
    addWatchLock =false;
}
function bindWatch(dir){
    let d = domain.create();
    d.run(()=>{
        if( watchCache[dir] ){
            watchCache[dir].close();
            watchCache[dir] = null;
        }
        watchCache[dir] =  fs.watch(dir,{recursive:true},function(type,file){
            // console.log("watch:".red,dir," event:",type,file,count++);
            if(changeMsg.indexOf(dir+"/"+file)==-1){
                changeMsg.push(dir+"/"+file);
            }
            handleChange(dir);
        });
    })
    //捕获异步异常,删除监听文件会抛出异常
    d.on('error', function (err) {
       console.log(err);
    });
}
function handleChange(orgDir){
    if(addWatchLock){return}
    //每隔1s执行一下回调
    clearTimeout(timer)
    timer = setTimeout(function () {
        watchCallback[orgDir].forEach((callback)=>{
            if(typeof callback=="function"){
                callback(changeMsg);
            }
        })
      
        changeMsg.length = 0;
    },1000);
}
function clearAllWatch(){
    for(var dir in watchCache){
        if( watchCache[dir] ){
            watchCache[dir].close();
            watchCache[dir] = null;
        }
    }
}

exports = module.exports = addWatch;