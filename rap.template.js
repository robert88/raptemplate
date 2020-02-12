require("@/lib/rap.prototype.js");
/**
* 模板解析器
*{{variable}} {{#each array}} {{$index}} {{$length}} {{$value}} ... {{#endEach}} {{#if}} ... {{#elseIf}} ... {{#endIf}}
 * <!--#if--><!--#elseif--><!--#else--><!--#endIf--><!--#each--><!--#endeach-->辅助反编译
*/

//循环

function templ (templStr,json,setHelp){
    var eachID = 0;
        var help;
        if(!setHelp){
            help = ["","","","","","",""];
        }else{
            help = ["<!--#each-->","<!--#eachItem-->","<!--#endeach-->","<!--#if-->","<!--#elseIf-->","<!--#else-->","<!--#endIf-->"]
        }
         templStr = templStr.seam()
         //each
         .replace(/\{\{#each\s+([^}]+)\s*\}\}/g,function(m,m1){
            eachID++;
            let templId = eachID;
            let parentStr="";
            while(templId>0){
                parentStr += "if(!$parent){"
                parentStr +=" $parent= $parent"+(templId-1)+";}";
                templId--;
            }
            return "\"+(function(){var $length ="+m1+"&&"+m1+".length; var t=\"\";"+m1+"&&"+m1+".forEach(function($value,$index){ "+
            "var $ID ="+eachID+";"+
            "var $parent;"+parentStr+
            "var $parent"+eachID+"={$value:$value,$length:$length,id:"+eachID+",$index:$index,$parent:$parent};\n t+= \""
        })
        .replace(/\{\{#endEach\s*\}\}/g,help[2]+"\"});return t;}()) +\"")
        //ifelse
        .replace(/\{\{#if\s+([^}]+)\s*\}\}/g,function(m,m1){
            return "\";if("+m1.replace(/\\/g,"")+"){ t+=\""+help[3]
        }).replace(/\{\{#elseIf\s+([^}]+)\s*\}\}/gi,function(m,m1){
            return "\";}else if("+m1.replace(/\\/g,"")+"){ t+=\""+help[4]
        }).replace(/\{\{#else\s*\}\}/g,function(m,m1){
            return "\";}else{ t+=\""+help[5]
        }).replace(/\{\{#endIf\s*\}\}/gi,function(m,m1){
            return "\";} t+=\""+help[6]
        })
        //表达式/变量
        .replace(/\{\{\s*([^}]+)\s*\}\}/g,function(m,m1){
            return "\"+(("+m1.replace(/\\/g,"")+")==null?'':("+m1.replace(/\\/g,"")+"))+\""
        })
        //顶层$parent没有定义
        var defindedParentstring = "";
        while(eachID>0){
            defindedParentstring += "var $parent"+(eachID-1)+";"
            eachID--;
        }
  
        try{
            var result = "with(obj){try{"+defindedParentstring+"var t =\""+templStr.replace(/\+$/,"")+"\"; }catch(e){debugger;console.log(e.message);console.log('parse error:'.error,obj.__templatefile);} return t;}"
            var fn = new Function("obj",result);
            // result = null;
        }catch (e){
            console.log(e.message,"parse error:".error,json.__templatefile);
            return result;
        }
        return fn(json);
}

/**
 *分割但是不替换
 */
function splitNotReplace(c,reg){
    var a=[];var d=0;c.replace(reg,function(m,m1){a.push(c.slice(d,m1));d=m1+m.length;a.push(m);});if(d<c.length){a.push(c.slice(d,c.length))}
    return a;
}

function parseTeample(orgHtml,orgConfigData){

    var includeReg = splitNotReplace(orgHtml,/<script[^>]*>[\u0000-\uFFFF]*?<\/script>/gmi);

    //过滤掉script标签
    includeReg.forEach(function (str,idx) {
        if(/^<script/.test(str)){
            orgHtml = orgHtml.replace(str,"_____script_template_____"+idx) 
        }else{
            // includeReg[idx] =  str.replace(/\\/g,"\\\\").replace(/(\n|\r)+/g,"\\n").replace(/("|')/g,"\\\$1").replace(/\n/g,"\"+\n\"")
        }
    });
    

    orgHtml =  templ(orgHtml,orgConfigData);

    //过滤掉script标签
    includeReg.forEach(function (str,idx) {
        if(/^<script/.test(str)){
            orgHtml = orgHtml.replace("_____script_template_____"+idx,str); 
        }else{
            // includeReg[idx] =  str.replace(/\\/g,"\\\\").replace(/(\n|\r)+/g,"\\n").replace(/("|')/g,"\\\$1").replace(/\n/g,"\"+\n\"")
        }
    });
    return orgHtml;
}



exports = module.exports = parseTeample;
