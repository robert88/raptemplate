//package.json所在路径
const rootPath = __dirname;
//防止死循环，（这个模块可能被多次加载，那么oldRequire如何赋值多次，会拿不到node 原生的require）
global.rap = global.rap||{}
rap.oldRequire = rap.oldRequire|| module.constructor.prototype.require;

//__dirname表示必须是根目录，所以rpa.alias.js必须放到根目录下
module.constructor.prototype.require = function function_name(orgFile) {
	if(!orgFile){
		return "";
	}
	var file = orgFile;
	if(/^@\//.test(orgFile)){
         file = orgFile.replace(/^@/,rootPath);
	}

	return rap.oldRequire.call(this,file);
}
exports = module.exports = {
	resolve(file){
        if(!file){
            return "";
        }
		return file.replace(/^@/,rootPath);
	}
}
