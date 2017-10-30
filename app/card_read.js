var FFI = require('ffi'),
    ArrayType = require('ref-array'),
    Struct = require('ref-struct'),
    ref = require('ref');
    iconv = require('iconv-lite');

var fs = require('fs');


var voidPtr = ref.refType(ref.types.void);

var cardpath=__dirname.split("app")[0]+"app\\card\\termb.dll";
console.log(cardpath);
//TODO ./termb.dll
exports.CR = new FFI.Library(cardpath, {
  InitComm: [ref.types.int32, [
    ref.types.int32,
  ]],
  InitCommExt: [ref.types.int32, []],
  CloseComm: [ref.types.int32, []],
  Authenticate: [ref.types.int32, []],
  Read_Content: [ref.types.int32, [
    ref.types.int32,
  ]],
  GetSAMID: [ref.types.int32, [
    voidPtr,
  ]],
  GetBmpPhoto: [ref.types.int32, [
    voidPtr,
  ]],
  Reset_SAM: [ref.types.int32, []],
  GetSAMStatus: [ref.types.int32, []],
});

exports.readIdInfo = function () {

var retv = -1;
var results = {};

retv = exports.CR.InitCommExt();
//console.log('InitCommExt ret=' + retv);

// <=0表示初始化失败
if (retv <= 0) {
  return -1001;
}

retv = exports.CR.Authenticate();
//console.log('Authenticate ret=' + retv);

//返回 1表示正确 放置卡，返回其他未或者片不表示正确放置卡
if (retv != 1) {
  return -1002;
}


retv = exports.CR.Read_Content(1);
//console.log('Read_Content ret=' + retv);

//1 正确； 正确； 0 读卡错误； 读卡错误； 读卡错误； 2 没有最新住址信息； 没有最新住址信息； 没有最新住址信息； 没有最新住址信息； 没有最新住址信息； 3 正确，并且有指纹信息； 正确，并且有指纹信息； 正确，并且有指纹信息； 正确，并且有指纹信息； 正确，并且有指纹信息； -1 相 片解码错误； 片解码错误； 片解码错误； -2 wlt 文件后缀错误； 文件后缀错误； 文件后缀错误； 文件后缀错误； -3 wlt 文件打开错误； 文件打开错误； 文件打开错误； 文件打开错误； -4 wlt 文件格式错误； 文件格式错误； 文件格式错误； 文件格式错误； -5 软 件未授权； 件未授权； -11 无效参数 
if (retv != 1) {
  return retv;
}

var xp=__dirname.split("app")[0]+"app\\card\\xp.wlt";
console.log(xp);
// retv = exports.CR.GetBmpPhoto(ref.allocCString("xp.wlt"));
retv = exports.CR.GetBmpPhoto(ref.allocCString(xp));
//console.log('GetBmpPhoto ret=' + retv);

//1成功,并在当前目录生成zp.bmp(102*126 24bit)；0为失败
if (retv != 1) {
  return -1003;
}

var wz=__dirname.split("app")[0]+"app\\card\\wz.txt";
var data256 = fs.readFileSync(wz);

//姓名
var start = 0;
var end = start + 30;
var name = data256.slice(start, end);

//性别代码
start = end;
end = start + 2;
var sexCode = data256.slice(start, end);

//名族代码
start = end;
end = start + 4;
var ethnicCode = data256.slice(start, end);

//生日
start = end;
end = start + 16;
var birthDate = data256.slice(start, end);

//住址
start = end;
end = start + 70;
var address = data256.slice(start, end);

//身份证号
start = end;
end = start + 36;
var idNumber = data256.slice(start, end);

//签发机关
start = end;
end = start + 30;
var issuer = data256.slice(start, end);

//有效期开始
start = end;
end = start + 16;
var effectDate = data256.slice(start, end);

//有效期结束
start = end;
end = start + 16;
var expiryDate = data256.slice(start, end);


//预留
start = end;
end = start + 36;
var appendInfo = data256.slice(start, end);



results = {
  name: iconv.decode(name, 'UTF-16').trim(),
  sexCode: iconv.decode(sexCode, 'UTF-16').trim(),
  ethnicCode: iconv.decode(ethnicCode, 'UTF-16').trim(),
  birthDate: iconv.decode(birthDate, 'UTF-16').trim(),
  address: iconv.decode(address, 'UTF-16').trim(),
  idNumber: iconv.decode(idNumber, 'UTF-16').trim(),
  issuer: iconv.decode(issuer, 'UTF-16').trim(),
  effectDate: iconv.decode(effectDate, 'UTF-16').trim(),
  expiryDate: iconv.decode(expiryDate, 'UTF-16').trim(),
  appendInfo: iconv.decode(appendInfo, 'UTF-16').trim()
};
//TODO   name: iconv.decode(ref.reinterpretUntilZeros(Buffer.from(personInfo.name), 1), 'GBK'),
//TODO   name = name.substring(0,name.indexOf('\u0000'))

console.log(JSON.stringify(results));

exports.CR.CloseComm();

return results;
}

