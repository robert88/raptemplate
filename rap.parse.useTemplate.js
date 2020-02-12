const {parseTag,clearNoteTag} = require("@/compiler/rap.parse.js");
const wake = require("@/lib/rap.filesystem.js");
const parseTeample = require("@/lib/rap.template.js");
const {handleUseModule} = require("@/compiler/rap.parse.useModule.js");
const {handleIncludeFile} = require("@/compiler/rap.parse.include.js");
const {resolve} = require("@/rap.alias.js");
/*处理模板，解析useTemplate
* */
function handleUseTemplate(orgHtml,orgConfigData,toServerPath,relativeWatch) {

    var toServerPath = toServerPath||resolve;

    orgHtml = parseTeample(orgHtml,orgConfigData);

    //编译出问题了
    if(!orgHtml||orgHtml.indexOf("with(obj)")==0){
        return orgHtml;
    }

    orgHtml = handleUseModule(orgHtml,orgConfigData,toServerPath,{},relativeWatch);

    orgHtml = handleIncludeFile(orgHtml,orgConfigData,toServerPath,{},relativeWatch);

    return orgHtml;
}

 module.exports ={
    handleUseTemplate:handleUseTemplate
}