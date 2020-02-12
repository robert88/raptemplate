global.rap = global.rap || {};
exports =module.exports = {
    //上下文必须是mod
    clearRequireCache:function (file,mod,need) {
        if(rap.config&&rap.config.delRequireCache || need){
            //会导致死循环
            // let key =  module.constructor._resolveFilename(file, mod, false);
            try{
                delete require.cache[require.resolve(file)];
            }catch (e) {
              // console.warn("not find ca")
            }
        }
    }
}