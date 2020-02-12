const { resolve } = require("@/rap.alias.js");
const { parseTag, clearNoteTag } = require("@/compiler/rap.parse.js");
const wake = require("@/lib/rap.filesystem.js");
const { tool } = require("@/compiler/rap.findFileData.js");
const pt = require("path");
//循环引用问题
// const { handleUseTemplate } = require("@/compiler/rap.parse.useTemplate.js");
/*处理模板，解析useTemplate
* */
function handleUseModule(orgHtml, parentData, toServerPath, unique, relativeWatch) {

    let {handleUseTemplate} = require("@/compiler/rap.parse.useTemplate.js");

    toServerPath = toServerPath || resolve;

    unique = unique || {};

    relativeWatch = relativeWatch || {};

    orgHtml = clearNoteTag("useModule", orgHtml);
    var tags = parseTag("useModule", orgHtml);

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

        var replaceWith = tagInfo.attrs.replaceWith;

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
            currentData = rap.extend("deepNotArray", {},currentData, parentData,setModuleSpace);
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

        //跳出了下级
        unique[src] = 2;

        htmlFromTag = clearNoteTag("replaceWith", htmlFromTag);

        var replaceTags = parseTag("replaceWith", htmlFromTag);

        //使用去掉模板标签
        var innerHTML = tagInfo.innerHTML;

        //将模板和innerHTML结合

        if (!replaceWith  || replaceTags.length == 0) {

            //插入到body里面
            var templHtmlBody = parseTag("body", htmlFromTag)[0];
            if (templHtmlBody) {
                htmlFromTag = htmlFromTag.replace(templHtmlBody.template, templHtmlBody.startTag + templHtmlBody.innerHTML + innerHTML + templHtmlBody.endTag);
            //插到后面
            } else {
                htmlFromTag=htmlFromTag + innerHTML;
            }
            //插入到指定位置
        } else if (replaceWith && replaceTags.length > 0) {
            var findReplace = false;
            replaceTags.forEach(function (tag) {
                if (replaceWith == tag.attrs.id) {
                    htmlFromTag = htmlFromTag.replace(tag.template, innerHTML);
                    findReplace = true;
                }
            });
            
            if(!findReplace){
                console.log("not find replaceWith".error,replaceWith);
            }
        } else {
            console.log("not find replaceWith".error,replaceWith);
        }

        orgHtml = orgHtml.replace(tagInfo.template, htmlFromTag);

    });

    return orgHtml;
}

module.exports = {
    handleUseModule: handleUseModule
}