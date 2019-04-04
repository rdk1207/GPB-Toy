var examples = [];

examples[0] = {name: 'Custom'};
examples[0].proto = localStorage.getItem('proto');
examples[0].payload = localStorage.getItem('payload');

examples[1] = {name: 'Person Message'};
examples[1].proto = `
message Person {
    required string name = 1;
    required int32 id = 2;
    optional string email = 3;
}`
examples[1].payload = `return {name: 'Zaphod', id: 42, email: 'zaphod@magrathea.com'};`;
examples[1].selectedType = 1;

examples[2] = {name: 'Multiple Messages'};
examples[2].proto = `
message Person {
    required string name = 1;
    required int32 id = 2;
    optional string email = 3;
}

message Group {
    required string name = 1;
    required Person leader = 2;
    repeated Person members = 3;
}`;

examples[2].payload = `
var zaphod = {name: 'Zaphod', id: 42, email: 'zaphod@magrathea.com'};
var arthur = {name: 'Arthur', id: 43, email: 'arthur@earth.com'};
var group = {
   name: 'Crew',
   leader: zaphod,
   members: [zaphod, arthur]
};
//be sure to select Group as the Type
return group;`;

class CodeBox {
    constructor(htmlElement){ this.element = htmlElement; }
    get(){ return this.element.value; }
    set(text){ this.element.value = text; }
}

class DropDown {
    constructor(htmlElement){ this.htmlElement = htmlElement; }
    get(){ return this.htmlElement.value; }
    clear(){ this.htmlElement.innerHTML = ''; }
    add(option, value){ 
        var option = '<option value="' + value + '">' + option + '</option>'
        this.htmlElement.innerHTML += option;
    }
}

var typeInput = null;
var protoInput = null;
var payloadInput = null;
var dataInput = null;
var protoRoot = null;

document.addEventListener('DOMContentLoaded', e => {
    typeInput = new DropDown(document.getElementById('type'));
    exampleInput = new DropDown(document.getElementById('example'));
    protoInput = new CodeBox(document.getElementById('proto'));
    payloadInput = new CodeBox(document.getElementById('payload'));
    dataInput = new CodeBox(document.getElementById('data'));

    document.getElementById('proto').addEventListener('input', e => {
        document.getElementById('encode').disabled = true;
        document.getElementById('decode').disabled = true;
    });

    for(var i in examples){
        exampleInput.add(examples[i].name, i);
    }

    exampleInput.htmlElement.selectedIndex = parseInt(localStorage.getItem('selectedExample'));
    loadExample();
});

function getMessage(callback){
    var type = typeInput.get();
    var Message = null;
    var errMsg = null;

    try{
        Message = protoRoot.lookupType(type);
    }
    catch(err){
        errMsg = err;
    }
    if(errMsg){
        callback(null, errMsg);
    }
    else{
        callback(Message, null);
    }
}

function compile(){
    var errMsg = null;
    var root = null;
    try{ root = protobuf.parse(protoInput.get()).root; }
    catch(err){ errMsg = err; }
    
    if(errMsg){
        dataInput.set(errMsg);
    }
    else {
        typeInput.clear();
        Object.keys(root.nested).forEach(type => typeInput.add(type, type));
        protoRoot = root;
        document.getElementById('encode').disabled = false;
        document.getElementById('decode').disabled = false;
    }
}

function encode(){
    var errMsg = null;
    var payload = null;
    try{
        payload = eval('(function(){' + payloadInput.get() + '})()');
    }
    catch(err){
        errMsg = err;
    }
    
    if(errMsg){
        dataInput.set('Invalid Payload JS - ' + errMsg);
    }
    else{
        getMessage((Message, err) => {
            if(err){
                dataInput.set(err);
            }
            else{
                err = Message.verify(payload);
                if(err) dataInput.set('Invalid Message - ' + err);
                else dataInput.set(Message.encode(payload).finish());
            }
        });
    }
}

function decode(){
    var data = dataInput.get();
    var buffer = new Uint8Array(data.split(',').map(item => parseInt(item)));

    getMessage((Message, err) => {
        if(err){
            payloadInput.set(err);
        }
        else{
            var message = 'return ' + JSON.stringify(Message.decode(buffer)) + ';';
            payloadInput.set(message);
        }
    });
}

function save(){
    localStorage.setItem('proto', protoInput.get());
    localStorage.setItem('payload', payloadInput.get());
    localStorage.setItem('selectedExample', exampleInput.get());

    examples[0].proto = protoInput.get();
    examples[0].payload = payloadInput.get();

    exampleInput.htmlElement.options.selectedIndex = 1;
    loadExample();
}

function loadExample(){
    var index = parseInt(exampleInput.get());
    protoInput.set(examples[index].proto);
    payloadInput.set(examples[index].payload);
    compile();
    
    dataInput.set('');
}
