const {namespace} = require("@/lib/rap.namespace.js");

let startTag = "<[a-zA-Z]+[^>]*>";
let endTag = "<\\/[a-zA-Z]+\\s*>";

let eachReg ="\\{\\{#each\\s+[^}]+\\s*\\}\\}";
let endEachReg = "\\{\\{#endEach\\s*\\}\\}";
let ifReg = "\\{\\{#if\\s+[^}]+\\s*\\}\\}";
let elseReg ="\\{\\{#else\\s*\\}\\}";
let elseIfReg = "\\{\\{#elseIf\\s+[^}]+\\s*\\}\\}";
let endIfReg = "\\{\\{#endIf\\s*\\}\\}";

let eachRegCompiler ="<!--#each-->";
let endEachRegCompiler = "<!--#endEach-->";
let ifRegCompiler = "<!--#if-->";
let elseRegCompiler ="<!--#else-->";
let elseIfRegCompiler = "<!--#elseIf-->";
let endIfRegCompiler = "<!--#endIf-->";
let eachItemRegCompiler = "<!--#eachItem-->";//分割每一个item

let prevEachRegCompiler ="<!--#(each)-->";
let prevIfRegCompiler = "<!--#(if)-->";
let prevElseRegCompiler ="<!--#(else)-->";
let prevElseIfRegCompiler = "<!--#(elseIf)-->";
let prevEndEachRegCompiler = "<!--#(endEach)-->";
let prevEndIfRegCompiler = "<!--#(endIf)-->";
let prevEachItemRegCompiler = "<!--#(eachItem)-->";//分割每一个item

let exceptionReg = "\\{\\{\\s*[^}]+\\s*\\}\\}";

let prevStartTag = "<([a-zA-Z]+)[^>]*>"
let prevEach ="\\{\\{#(each)\\s+([^}]+)\\s*\\}\\}";
let prevIf ="\\{\\{#(if)\\s+[^}]+\\s*\\}\\}";
let prevElseIf ="\\{\\{#(elseIf)\\s+[^}]+\\s*\\}\\}";
let prevElse ="\\{\\{#(else)\\s*\\}\\}";

let nextEndTag = "<\\/([a-zA-Z]+)\\s*>"
let nextEndEach = "\\{\\{#end(Each)\\s*\\}\\}";
let nextEndIf = "\\{\\{#end(If)\\s*\\}\\}";

let startExc = "\\("
let endExc = "\\)"
let OrExc = "\\|\\|"
let andExc = "&&"

/**
 * 得到父类闭包
 */
function getParentParse(index,token){
    if(index==0){
        return null;
    }else{
        let prevParse = token[index-1];
        if((prevParse.type=="start"||prevParse.type=="endStart")&&prevParse.hasEnd && !prevParse.closeEnd){
            return prevParse
        }else{
            return getParentParse(index-1,token);
        }
    }
}
/**
 *
 * @returns {*}
 * 定义了三种树结构
 */
function getRule(type,coustomRule){

    var ifRegRule = eachReg+"|"+endEachReg+"|"+ifReg+"|"+elseReg+"|"+elseIfReg+"|"+endIfReg;
    let ifRegCompilerRule =  eachRegCompiler+"|"+endEachRegCompiler+"|"+ifRegCompiler+"|"+elseRegCompiler+"|"+elseIfRegCompiler+"|"+endIfRegCompiler+"|"+eachItemRegCompiler;
    let rule = {
        "xml":{
            split:new RegExp("("+startTag+"|"+endTag+")","i"),
            startMatch:new RegExp(prevStartTag,"i"),
            endMatch:new RegExp(nextEndTag,"i"),
            single:/br|input|hr|img|link|meta|param|\/>$/i
        },
        "template":{
            split:new RegExp("("+startTag+"|"+endTag+"|"+ifRegRule+"|"+ifRegCompilerRule+")","i"),
            startMatch:new RegExp(prevStartTag+"|"+prevEach+"|"+prevIf+"|"+prevEachRegCompiler+"|"+prevIfRegCompiler,"i"),
            endMatch:new RegExp(nextEndTag+"|"+nextEndEach+"|"+nextEndIf+"|"+prevEndEachRegCompiler+"|"+prevEndIfRegCompiler,"i"),
            endStartMatch:new RegExp(prevElseIf+"|"+prevElse+"|"+prevElseRegCompiler+"|"+prevElseIfRegCompiler+"|"+prevEachItemRegCompiler,"i"),
            single:/br|input|hr|img|link|meta|param|\/>$/i,
            templateTag:new RegExp(ifRegRule+"|"+ifRegCompilerRule,"i"),
        },
        "excption":{
            split:new RegExp("("+startExc+"|"+endExc+"|"+OrExc+"|"+andExc+")","i"),
            startMatch:new RegExp(startExc,"i"),
            endMatch:new RegExp(endExc,"i"),
        }
    };

    let useRule = coustomRule&&coustomRule[type]||rule[type];

    if(!useRule.split){
        throw Error("can not find rule split RegExp");
    }
    if(!useRule.startMatch){
        throw Error("can not find rule startMatch RegExp");
    }
    if(!useRule.endMatch){
        throw Error("can not find rule endMatch RegExp");
    }
    return useRule;
}

/**
 *
 * @returns {*}
 * 清除正则多次匹配位移问题
 */
function cleanRuleMatch(useRule){
    useRule.startMatch.lastIndex = 0
    useRule.endMatch.lastIndex = 0
    useRule.single && (useRule.single.lastIndex = 0)
    useRule.templateTag && (useRule.templateTag.lastIndex = 0)
}

/**
 *
 * @returns {*}
 * 匹配正则
 */
function matchReg$(){
	for(var i=1;i<10;i++){
		if(RegExp["$"+i]){
			return RegExp["$"+i];
		}
	}
	return "unknow";
}
/**
 *
 *处理结束标签
 */
function handleEnd(parse,index){
    parse.tag = matchReg$().toLowerCase();
    let isIfEnd = /endif|else|elseif/i.test(parse.tag)&&/elseif|if|else/i.test(parse.parent.tag);
    let isEachEnd = /endeach|eachItem/i.test(parse.tag)&&/eachItem|each/i.test(parse.parent.tag);
    //如果tag不一致将忽略掉，或者是if else endif这样的
    if(parse.parent&&(parse.tag==parse.parent.tag||isIfEnd || isEachEnd)){
        //结束标签需要跟随开始标签
        parse.startParse = parse.parent;
        parse.parent.endIndex = index;
        parse.parent.endParse = parse;
        //需要关闭开始标签
        parse.startParse.closeEnd = true;
        parse.level = parse.startParse.level;
        parse.parent = parse.startParse.parent;
    }else{
        parse.startParse =null;
    }
}
/**
 * 语法词
 *parse数据结构： {level:0,type:"none",match:"",tag:"",hasEnd:false,closeEnd:false,parent:null,startParse:null,isTemplateTag:false,endIndex:null}
 */
function tokenizer(str,type,coustomRule){


    //把开始和结尾分割为数组
    let useRule = getRule(type,coustomRule)

    let splitStr = str.split(useRule.split);

    let token = [];
    let deep = 0;//深度
    let tagLength = 0;
    splitStr.forEach((parseStr)=>{
        if(parseStr.trim()==""){
            return;
        }
        let index = token.length;//当前的索引为token的长度
        let parse = {level:0,type:"none",match:parseStr};

        parse.parent = getParentParse(index,token);
        if(parse.parent){
            if(parse.parent.isTemplateTag){
                parse.level = parse.parent.level;
            }else{
                parse.level = parse.parent.level+1;
            }
        }else{
            parse.level = 0;
        }

        if(useRule.templateTag && useRule.templateTag.test(parseStr)){
            parse.isTemplateTag = true;
        }else{
            tagLength++;
        }

        deep = Math.max(parse.level,deep);

        cleanRuleMatch(useRule);

        //开始
        if(	useRule.startMatch.test(parseStr) ){
            parse.tag = matchReg$().toLowerCase();
            parse.type ="start"
            if(useRule.single && !useRule.single.test(parse.tag)){
                parse.hasEnd = true;
            }

            //结束
        }else if(useRule.endMatch.test(parseStr)){
            handleEnd(parse,index);
            parse.type ="end"
        }else if(useRule.endStartMatch.test(parseStr)){
            handleEnd(parse,index);
            parse.hasEnd = true;
            parse.type ="endStart"
        }
        cleanRuleMatch(useRule);
        token.push(parse);
    });
    return {token:token,deep:deep+1,length:tagLength};

}
/**
 *转换为树形结构
 * */
function toTree(children,tokens,idx,parent){

    var token = tokens[idx];
    if(idx>=tokens.length){
        return idx;
    }

    if(token.type=="start"&&token.hasEnd){
        token.children = [];
        children.push(token);
        //得到结束的idx
        idx = toTree(token.children,tokens,idx+1,children);
        //还得往下跑
        return  toTree(children,tokens,idx+1,parent);
    }else if(token.type=="end"){
        //返回给start
       return idx
    }else if(token.type=="endStart"&&token.hasEnd){
        token.children = [];
        //上一级添加
        parent.push(token);
        //得到结束的idx
        return toTree(token.children,tokens,idx+1,parent);
    }else{
        children.push(token);
        return  toTree(children,tokens,idx+1,parent);
    }
}

/**
 *
 * @param templaterTree
 * @param compilerTree
 * @param parent
 * @param type
 * @returns {boolean}
 * templaterTree是模板树，compilerTree是编译之后的树，parent是接收的对象，type是当前的tag
 */
function compareTree(templaterTree,compilerTree,parent){

    if(!templaterTree||!compilerTree){
        return false;
    }

    let len = compilerTree.length
    //i是编译后的遍历索引，j是template的遍历索引；
    for(var i=0,j=0;i<len;i++,j++){
        let templaterParse;
        let compilerParse = compilerTree[i];
        //each模板和if一样，
        templaterParse = templaterTree[j];
        if(!templaterParse){
            continue;
        }

        //数据不从条件编译提取
        if(!templaterParse.isTemplateTag){
            if(templaterParse.match!=compilerParse.match){
                var count = setVeriableMatch(templaterParse,compilerParse,parent,i,len);
                i = i+count;
            }
        }
        //遍历子类
        if(templaterParse.children&&templaterParse.children.length){


            if(templaterParse.tag=="each"){
                let eachObject = [];
                let eachKey = templaterParse.match.match(new RegExp(prevEach,"i"));
                eachKey&&eachKey[2]&&namespace(eachKey[2],eachObject,parent);
                //通过一个对象来接收不同的值，得到值将会赋值给$value,根据eachItem来确认
               var count2 =  compareNextTree(templaterParse,compilerTree,i+1,len,{count:0},eachObject);
                i = i+count2;
            }else{
                compareTree(templaterParse.children,compilerParse.children,parent);
            }
        }
    }
    if(len){
        return true;
    }else{
        return false;
    }
}

function compareNextTree(templaterParse,compilerTree,idx,len,couter,eachObject){
    let compilerParse = compilerTree[idx]
    if(!compilerParse||idx>=len){
        return;
    }
    if(compilerParse.tag=="eachitem"){
        couter.count++;
        let getParent = {}
        compareTree(templaterParse.children,compilerParse.children,getParent);
        eachObject.push(getParent.$value)
        compareNextTree(templaterParse,compilerTree,idx+1,len,couter,eachObject)
    }
    return couter.count;
}

/**
 *
 * @param nextTemplateParse
 * @returns {boolean}
 * 判断一个树是否没有编译参数，可以认为是变量动态插入的html结构
 */

function hasTemplateTag(nextTemplateParse){
    let ret = false;
    if(nextTemplateParse.isTemplateTag){
        return true
    }
    if(nextTemplateParse.children){
        nextTemplateParse.children.forEach(function (parse) {
          if(hasTemplateTag(parse)){
              ret = true;
              return false;
          }
        })
    }
    return ret;
}

/**
 *
 * @param compilerParse
 * @param ret
 * @returns {string}
 * 将树合并为str
 */
function combareMatch(compilerParse,ret) {
     ret.push(compilerParse.match)
    if(compilerParse.children){
        compilerParse.children.forEach(function (parse) {
            combareMatch(parse,ret)
        })
    }
    if(compilerParse.endParse){
        ret.push(compilerParse.endParse.match)
    }
    return ret.join("")
}

/**
 *
 *匹配值，内部匹配就是将当前的一个树匹配
 */
function matchValue(parentStr,templaterParse,compilerParse,idx,len,count,templateIndex){

    if(idx>=len){
        return parentStr
    }
    //如果存在compiler，或者是个树结构，且树里面没有模板
    if(!compilerParse|| hasTemplateTag(compilerParse)){
        return parentStr
    }else{
        let isNotNextMatchtemplate = true;
        let nextTemplateParse;
        // 下一个和下一个模板不匹配，表示这个还是上一个的一部分
        let nextCompilerParse = compilerParse.parent.children[idx+1];

        //存在匹配模板templateIndex始终是最开始传递进来的值
        if(templaterParse){
            nextTemplateParse = templaterParse.parent.children[templateIndex+1];
            isNotNextMatchtemplate =  !nextCompilerParse || !nextTemplateParse || (nextTemplateParse.match!=nextCompilerParse.match);
        }

        //存在往下匹配
        if (isNotNextMatchtemplate) {
            count.count++;
            //idx+1会推进下一个compilerParse
            return matchValue(parentStr + combareMatch(compilerParse, []), nextTemplateParse, nextCompilerParse, idx + 1, len, count,templateIndex);
            //存在内部匹配
        } else {
            return parentStr + combareMatch(compilerParse, [])
        }
    }
}

/**
 *
 * @param tStr 匹配的字符串
 * @param cStr 编译之后的字符串
 * @param parent 收集数据的对象
 * 算法，解析“name.prop”为对象给parent，把表达式转为正则来匹配对应的值
 */
function setVeriableMatch(templaterParse,compilerParse,parent,idx,len) {
    let tStr = templaterParse.match.trim();
    let exceptionReg = "\\{\\{\\s*([^}]+)\\s*\\}\\}";
    let toRegTemp = tStr.replace(new RegExp(exceptionReg,"ig"),"___middle_compiler___").trim().toReg().replace(new RegExp("___middle_compiler___","g"),"(.*?)");
    // 必须不匹配两边的空格
    let toReg = new RegExp("^\\s*"+toRegTemp+"\\s*$");
    var count = {count:0}
    let matchValueInfo = matchValue("",templaterParse,compilerParse,idx,len,count,idx);
    let values =  matchValueInfo.match(toReg);
    //tStr.match(exceptionReg);可以匹配()里面的值
    let keys = tStr.match(new RegExp(exceptionReg,"ig"));
    if(keys){
        keys.forEach(function (key,idx) {
            var value = values&&values[idx+1]||"";
            //匹配表达式
            key = key.replace(/^\{\{|\}\}$/g,"");

            if(key){
                namespace(key,value,parent);
            }

        });
    }
    //匹配到相邻的tree
    return count.count-1;
}

exports = module.exports = {
    tokenizer:tokenizer,
    compareTree:compareTree,
    toTree:toTree
}
