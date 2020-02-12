require("@/lib/rap.prototype.js");

function parseAttrs(attrArr,obj){
    if(attrArr){
        var attrs = {};
        attrArr.forEach(function (attrStr) {
            var splitAttr =  attrStr.split("=");
            var key = splitAttr[0].trim()
            if(key){
                attrs[ key ] = splitAttr[1].trim().replace(/^'|^"|'$|"$/g,"");
                if(key=="src" || key=="href"){
                    attrs[ "params" ] = attrs[ key ].split("?")[1];
                    attrs[ key ] = attrs[ key ].split("?")[0];
                }
            }
        });
        obj.attrs = attrs;
    }
}

//去掉注释
function getNoteArr(fileData){

    var noteReg =/<!--[\u0000-\uFFFF]*?-->/gm;
    var noteAttr = fileData.match(noteReg);
    if(noteAttr){
        noteAttr.forEach(function (note,idx) {
            fileData = fileData.replace(note,"<!--"+idx+"-->");
        })
    }
    return [fileData,noteAttr];
}
//还原注释
function replaceNote(innerHTML,noteAttr){
    var reg =/<!--[\u0000-\uFFFF]*?-->/gm;
    var orgArr = innerHTML.match(reg);
    if(orgArr){
        orgArr.forEach(function (item) {
            var index = item.replace(/<!--([\u0000-\uFFFF]*?)-->/gm,"$1")*1||0;
            innerHTML = innerHTML.replace(item,noteAttr[index])
        })
    }
    return innerHTML;
}

//提取params和修正src
function parseSrc(obj,requireCode,importReg){
    var src = requireCode.replace(importReg, "$1");
    src = src&&src.trim().replace(/^'|^"|'$|"$/g,"")||"";
    obj.src = src.split("?")[0];
    obj.params = src.split("?")[1];
}

exports = module.exports = {
    //只能解析单个tag
    parseTag(tag,fileData,single){
        var arr = [];
        var regStr,attrRegStr;
        if(single){
            regStr = "(<"+tag+"[^>]*>)";
            attrRegStr = "<"+tag+"([^>]*)>";
        }else{
            regStr ="(<"+tag+"[^>]*>)([\\u0000-\\uFFFF]*?)<\\/"+tag+">";
            attrRegStr = "<"+tag+"([^>]*)>([\\u0000-\\uFFFF]*?)<\\/"+tag+">";
        }

        if(/^\w+$/.test(tag)){
            var reg = new RegExp(regStr,"gmi");

            var noteInfo = getNoteArr(fileData);

            fileData = noteInfo[0];

            var tags = fileData.match(reg);
            if(tags){
                tags.forEach(function (tagStr) {
                    var obj = {template:replaceNote(tagStr,noteInfo[1]),attrs:{}};
                    obj.startTag = tagStr.replace( new RegExp(regStr,"i"),"$1");
                    if(!single){
                        obj.innerHTML = replaceNote(tagStr.replace( new RegExp(regStr,"i"),"$2"),noteInfo[1]);

                        obj.endTag = "</"+tag+">";
                    }
                    var attrStrOrg =  tagStr.replace( new RegExp(attrRegStr,"i"),"$1")
                   var attrArr1 =attrStrOrg.match(/[^='"\s]+="[^"]+"/g)||[];
                   var attrArr2 =attrStrOrg.match(/[^='"\s]+='[^']+'/g)||[];
                   var attrArr3 =attrStrOrg.match(/[^='"\s]+=[^"'\s]+/g)||[];
                   var attrArr = attrArr1.concat(attrArr2).concat(attrArr3);
                    parseAttrs(attrArr,obj);
                    arr.push(obj);
                })
            }
        }else{
            console.error("tag must is word");
        }
        return arr;
    },
    parseHtmlMergeTag(tag,code){
        var regStr = "(<!--\\s*start\\s"+tag+"\\s+[^>]*\\s*-->)([\u0000-\uFFFF]*?)<!--\\s*end\\s+"+tag+"\\s*-->";
        var attrRegStr = "<!--\\s*start\\s"+tag+"\\s+([^>]*)\\s*-->([\u0000-\uFFFF]*?)<!--\\s*end\\s+"+tag+"\\s*-->";
        var arr = [];
        if(/^\w+$/.test(tag)){
            var reg = new RegExp(regStr,"gmi");
            var tags = code.match(reg);
            if(tags){
                tags.forEach(function (tagStr) {
                    var obj = {template:tagStr,attrs:{}};
                    obj.startTag = tagStr.replace( new RegExp(regStr,"i"),"$1");
                    obj.innerHTML = tagStr.replace( new RegExp(regStr,"i"),"$2");
                    obj.endTag = "<!--end "+tag+"-->";
                    var attrArr = tagStr.replace( new RegExp(attrRegStr,"i"),"$1").match(/[^='"\s]+="?'?[^"']+"?'?/g);
                    parseAttrs(attrArr,obj);
                    arr.push(obj);
                })
            }
        }else{
            console.error("tag must is word");
        }
        return arr;
    },
    parseRequire(code) {
        var arr = [];
        if (!code) {
            return arr;
        }
        var importReg = /require\s*\(\s*"?'?\s*([^"']+)\s*"?'?\)\s*/gmi;

        //匹配多个require("/dfsdfsf/sa.js")
        var requireCodes = code.match(importReg) || [];

        requireCodes.forEach(function (requireCode) {
            var obj = {};
            importReg.lastIndex = 0;
            obj.template = requireCode;
            parseSrc(obj,requireCode,importReg);
            arr.push(obj);
        });
        return arr;
    },
    parseCssImport(code) {
        var arr = [];
        if (!code) {
            return arr;
        }
        var importReg = /import\s*\(\s*([^()]+)\s*\)\s*/gmi;

        //匹配多个require("/dfsdfsf/sa.js")
        var requireCodes = code.match(importReg) || [];

        requireCodes.forEach(function (requireCode) {
            var obj = {};
            importReg.lastIndex = 0;
            obj.template = requireCode;
            //得到src和params
            parseSrc(obj,requireCode,importReg);
            arr.push(obj);
        });
        return arr;
    },
    parseCssBackground(code) {
        var arr = [];
        if (!code) {
            return arr;
        }
        var bgReg = /\s*url\(\s*([^()]+)\s*\)\s*/gmi;

        //匹配多个url("/dfsdfsf/sa.js")
        var requireCodes = code.match(bgReg) || [];
        requireCodes.forEach(function (requireCode) {
            var obj = {};
            bgReg.lastIndex = 0;
            obj.template = requireCode;
            parseSrc(obj,requireCode,bgReg);
            arr.push(obj);
        });
        return arr;
    },
    clearNoteTag(tag,fileData,single){
        var regStr;
        if(single){
            regStr = "(<"+tag+"[^>]*>)";
        }else{
            regStr ="(<"+tag+"[^>]*>)([\\u0000-\\uFFFF]*?)<\\/"+tag+">";
        }
        var noteReg =/<!--[\u0000-\uFFFF]*?-->/gmi;

        var reg = new RegExp(regStr,"gmi");

        var replaceData =  fileData.replace(noteReg,function(val){
            return val.replace(reg,"")
        });
        return replaceData;
    }
}

