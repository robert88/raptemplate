const {parseTag} = require("@/compiler/rap.parse.js");
require("@/lib/rap.tool.js");

/**
 * 解析将js添加到body后面
* */
function sortJs(html){
    var jsArr = {};
   var scripts = parseTag("script",html);
    scripts.forEach(function (scriptFile) {
        var notMove = scriptFile.template.indexOf("data-not-move")!=-1;
        var src = scriptFile.attrs["src"];
        if(src&&!notMove){
            jsArr[src] = scriptFile.template;
            html = html.replace(scriptFile.template,"");
        }
    });

    // jsArr = rap.unique(jsArr);
    var jsstrArr = []
    Object.keys(jsArr).forEach(key=>{
        jsstrArr.push(jsArr[key])
    })

    if(~html.indexOf("</body>")){
        html = html.slice(0,html.lastIndexOf("</body>")) + jsstrArr.join("\n") + html.slice(html.lastIndexOf("</body>"),html.length)
    }else{
        console.log("error:html is not has </body>");
    }
    return html;
}
/**
 * 解析将css添加到head后面
 * */
function sortCss(html){
    var cssArr = {};
    var scripts = parseTag("link",html,true);
    scripts.forEach(function (scriptFile) {
        var notMove = scriptFile.template.indexOf("data-not-move")!=-1;
        var src = scriptFile.attrs["href"];
        var rel = scriptFile.attrs["rel"];
        if(src&&!notMove&&rel=="stylesheet"){
            cssArr[src.split("?")[0]]=scriptFile.template;
            html = html.replace(scriptFile.template,"");
        }
    });
    var cssstrArr = []
    Object.keys(cssArr).forEach(key=>{
        cssstrArr.push(cssArr[key])
    })

    // cssArr = rap.unique(cssArr);
    // var cssSrc = [];
    // cssArr.forEach(function (src) {
    //     cssSrc.push("<link href='"+src+"' rel='stylesheet'/>");
    // });

    if(~html.indexOf("</head>")){
        html = html.replace(/<\/head>/i,function () {return (cssstrArr.join("\n")+"</head>") })
    }else{
        console.log("error:html is not has </head>");
    }
    return html;
}

exports = module.exports ={
    sortCss:sortCss,
    sortJs:sortJs
}
