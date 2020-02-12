
const pt = require("path");
const wake = require("@/lib/rap.filesystem.js");
var namespace = "cn";
var tool = {
    /**
     * 获取.{lang}.js的数据
     * */
    getLangData:function(abDataPath,matchLang){
        abDataPath = this.toPath(abDataPath);
        var ret = {lang:matchLang};
         if(wake.isExist(abDataPath)){
             //清除缓存
             delete require.cache[require.resolve(abDataPath)];
             ret = require(abDataPath);
             ret.__basename = abDataPath;
             //覆盖当前文件lang
             ret.lang = matchLang;
         }
         return ret;
     },
     /**
      * 获取语言配置
      * */
     getLangByFile:function(file,options){
         var fileName = pt.basename(file);
         var filedir = pt.dirname(file);
         var lang = {};
         var abDataPath
         var matchLang
         if(options&&options.namespace){
            matchLang = options.namespace;
            abDataPath = file.replace(fileName,fileName.replace(/\.\w+\.html$/,".{0}.js".tpl(matchLang)).replace(/\.html$/,".{0}.js".tpl(matchLang)));//中文导出文件模板数据
            lang[matchLang] = this.getLangData(abDataPath,matchLang);
         }else if(/\.([a-z]+)\.html$/.test(fileName)){
              matchLang = RegExp.$1;
              abDataPath = file.replace(fileName,fileName.replace(".{0}.html".tpl(matchLang),".{0}.js".tpl(matchLang)));//中文导出文件模板数据
             lang[matchLang] = this.getLangData(abDataPath,matchLang);
         }else{
 
             wake.findFile(filedir,"js").forEach( (jsFile)=> {
                 if(/\.([a-z]+)\.js$/.test(jsFile)){
                      matchLang = RegExp.$1;
                     var jsFileName = pt.basename(jsFile);
                     if(jsFileName.replace(".{0}.js".tpl(matchLang),".html").toLowerCase()==fileName.toLowerCase()){
                         lang[matchLang] = this.getLangData(jsFile,matchLang,);
                     }
                 }
             })
             if(this.isEmptyObject(lang)){
                 lang[namespace] = {lang:namespace};
             }
         }
         return lang;
 
     },
         /**
     * 是否是空对象
     * */
    isEmptyObject:function(obj){
        for(var i in obj){
            return false;
        }
        return true;
    },
    //根目录
    toServerPath (file) {
        return this.toPath(pt.resolve(__dirname,"../../../.."+file));
    },

    //统一路径格式
    toPath(path){
        if(!path|| /^(http:|https:|\/\/|\\\\)/.test(path)){
            return path;
        }
        return path.replace(/(\/|\\)+/g,"/").replace(/(\/|\\)$/,"");
    }
}

module.exports= {
    tool:tool,
    setNamespace(name){
        namespace = name||"cn"
    }
}