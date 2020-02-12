const { resolve } = require("./rapserver/rap.alias.js");
require("@/lib/rap.prototype.js");
const { handleUseTemplate } = require("@/compiler/rap.parse.useTemplate.js");
const { tool, setNamespace } = require("@/compiler/rap.findFileData.js");
const { sortCss, sortJs } = require("@/compiler/rap.sort.cssAndJs.js");
const { packHtml } = require("@/compiler/rap.packHtml.js");
const wake = require("@/lib/rap.filesystem.js");
const watch = require("@/lib/rap.watch.js");
require("@/lib/rap.tool.js");
require("@/lib/rap.color.js");
var image = require("./images.js");
const pt = require("path");
//1、将src/html遍历一遍，得到访问的action
//2、对单个html解析
//解析useTemplate标签，如果没有的话就使用/src/template/index.html作为模板
//解析include标签，正对include标签提取js和css，并且开启合并打包，已打包过的不用打包了，根据json来解析html
//合并html根据兼容表生成不同版本的html（iOS，android，chrome，ie，ie10）


//当前文件相对根目录的位置
var toPath = tool.toPath.bind(tool);
var toServerPath = tool.toServerPath.bind(tool);
global.href = function(value) {
  return value ? ('href="' + value + '"') : '';
}

function searchFile(fileName, dir) {
  var addr = "";
  var fileList = wake.findFile(dir, pt.extname(fileName).replace(".", ""), true);
  fileList.forEach(function(val) {
    if (pt.basename(fileName) == pt.basename(val)) {
      addr = val;
      return false;
    }
  })
  return addr;
}
global.scaleImage = function(value, sizeAttr) {
  if (value) {
    var localFile = searchFile(value, "../images");
    console.log(localFile.red)
    if (wake.isExist(localFile)) {
      var size = image(fs.readFileSync(localFile))
      if (sizeAttr) {
        return "data-" + sizeAttr + "=\"" + value + "\" " + "data-" + sizeAttr + "-size=\"" + size.width + "x" + size.height + "\""
      } else {
        return "href=\"" + value + "\" data-size=\"" + size.width + "x" + size.height + "\""
      }
    } else {
      return ""
    }
  } else {
    return "";
  }
}
/*
 * 处理单个html，输出多个或者一个html
 * */
function hanlderHtml(entryFile, relativeFile, options) {


  var relativeWatch = {};



  var lang = tool.getLangByFile(entryFile, options);


  if (typeof lang !== "object") {
    throw "lang data error";
  }

  Object.keys(lang).forEach(la => {

    //获取入口文件不同语言的数据
    if (la != lang[la].lang) {
      console.log("config lang is not namespace!".warn);
    }

    if (!lang[la].namespace) {
      lang[la].namespace = lang[la].lang;
    }

    console.log(entryFile.replace("." + lang[la].lang + ".html", ".html"), "module will pack out:".green, lang[la].lang, "module will use data suffix:".green, lang[la].namespace);

    var orgHtml = wake.readData(entryFile);

    relativeWatch[entryFile] = 1;

    //监听数据
    if (lang[la].__basename) {
      relativeWatch[lang[la].__basename] = 1;
    }
    lang[la].__rootfile = entryFile;

    lang[la].__templatefile = entryFile;
    lang[la].__templatefilename = pt.basename(entryFile).replace(pt.extname(entryFile), "");;

    //打包的地方的数据最高
    lang[la] = rap.extend(true, {}, lang[la], options.data);

    orgHtml = handleUseTemplate(orgHtml, lang[la], toServerPath, relativeWatch);

    var out = {
      lang: lang[la].lang,
      namespace: lang[la].namespace,
      html: orgHtml
    };

    var outFile;
    //rootpath/{0}/relativeWatch
    var rootpath = pt.resolve(__dirname, "../..");

    outFile = toPath(rootpath + "/{0}/" + pt.relative(rootpath, entryFile.replace("." + lang[la].lang + ".html", ".html")).replace(/^(\\|\/)?build\d?(\\|\/)/g, ""))


    if (typeof options.outpath=="function") {
      outFile = options.outpath(outFile,out, entryFile);
    }

    outFileByEnv(out, outFile, relativeWatch);
  });

  //监听文件
  relativeFile[entryFile] = relativeWatch;
}


/*根据不同的兼容性输出（iOS，android，chrome，ie，ie10）*/
function outFileByEnv(out, outFile) {
  var htmlData = out.html;
  var outFileById = toPath(outFile.tpl(out.lang, out.namespace));
  htmlData = sortJs(sortCss(htmlData));
  wake.writeData(outFileById, htmlData);
  console.log((new Date).toString() + "----".bgYellow + "pack out:".yellow, outFileById);
}


global.pack = function(entryPath, options) {
  options = options || {};
  entryPath = toServerPath(entryPath);

  setNamespace(options.namespace);

  var relativeFile = {}
  if (wake.isFile(entryPath)) {
    hanlderHtml(entryPath, relativeFile, options);
  } else {
    var htmlArr = wake.findFile(entryPath, "html", true);

    //过滤掉template目录下的文件
    htmlArr = htmlArr.filter(file => toPath(file).indexOf("/template/") == -1);

    htmlArr.forEach(function(file) {
      file = toPath(file);
      hanlderHtml(file, relativeFile, options);
    });
  }
  //监听buid2
  watch(pt.resolve(__dirname, ".."), function(changeFiles) {
    handleChange(changeFiles)
  });

  //监听buid
  watch(pt.resolve(__dirname, "../../build"), function(changeFiles) {
    handleChange(changeFiles)
  });

  function handleChange(changeFiles) {
    var handleChangeFile = {};
    changeFiles.forEach(function(file) {
      file = toPath(file);
      if (wake.isExist(file) && wake.isFile(file)) {
        for (var orgHtmlFile in relativeFile) {
          orgHtmlFile = toPath(orgHtmlFile);
          if (relativeFile[orgHtmlFile][file]) {
            handleChangeFile[orgHtmlFile] = file;
          }
        }
      }
    })

    for (var file in handleChangeFile) {
      console.log("----".bgYellow + "change file:".green, handleChangeFile[file]);
      console.log("----".bgYellow + "triggle pack:".yellow, file, options.lang || options.namespace);
      file = toPath(file);
      hanlderHtml(file, relativeFile, options);
    }
  }
};


global.href = function(value) {
  return value ? ('href="' + value + '"') : '';
}