const { resolve } = require("@/rap.alias.js");
const { parseTag, clearNoteTag } = require("@/compiler/rap.parse.js");
const wake = require("@/lib/rap.filesystem.js");
const { tool } = require("@/compiler/rap.findFileData.js");
const pt = require("path");
/*处理include标签*/
function handleIncludeFile(orgHtml, parentData, toServerPath, unique, relativeWatch) {

    //只能放置到内部
    let {handleUseTemplate} = require("@/compiler/rap.parse.useTemplate.js");

    toServerPath = toServerPath || resolve;

    unique = unique || {};

    relativeWatch = relativeWatch || {};

    orgHtml = clearNoteTag("include",orgHtml);
    var tags = parseTag("include",orgHtml);

   
    tags.forEach(function (tagInfo) {

        var src = toServerPath(tagInfo.attrs.src);

        if (!src || !wake.isExist(src)) {
            console.log("not find".error,src);
            orgHtml = orgHtml.replace(tagInfo.template, "<!--error:not find file-->");
            return;
        }

        if (unique[src]==1) {
            console.log("circle include".error,src);
            orgHtml = orgHtml.replace(tagInfo.template, "<!--error:circle include-->");
            return;
        }

        unique[src] = 1;

        relativeWatch[src] = 1;

        var currentData = {};

        var moduleSpace = tagInfo.attrs.moduleSpace;

        
        var lang = tool.getLangByFile(src);
        
        //默认cn
        parentData.namespace = parentData.namespace||"cn";

        //数据
        if (parentData.namespace && lang[parentData.namespace]) {
            currentData = lang[parentData.namespace];
        }else{
            currentData =  lang[Object.keys(lang)[0]];
        }

        //是否有filename
        if(currentData.__basename){
            relativeWatch[currentData.__basename] = 1;
        }

        //指定moduleSpace
        if (moduleSpace) {
            var result = "with(obj){ try{ var t =" + moduleSpace + ";}catch(e){console.log(e)} return t;}"
            var fn = new Function("obj", result);
            var setModuleSpace = fn(parentData);
            currentData = rap.extend("deepNotArray", {}, currentData, parentData,setModuleSpace);
        } else {
            currentData = rap.extend("deepNotArray", {}, currentData, parentData);
        }

        if(currentData.__templatefile){
            currentData.__parentfile = currentData.__templatefile
        }

        currentData.__templatefile = src;

        currentData.__templatefilename = pt.basename(src).replace(pt.extname(src),"");

        var htmlFromTag = wake.readData(src);

        //递归调用
        htmlFromTag = handleUseTemplate(htmlFromTag,currentData,toServerPath,relativeWatch);

        unique[src] = 2;

        orgHtml = orgHtml.replace(tagInfo.template, htmlFromTag);

    });

    return orgHtml;
}

exports = module.exports ={
    handleIncludeFile:handleIncludeFile
}