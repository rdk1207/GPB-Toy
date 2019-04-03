class CodeBox{
    constructor(htmlElement){ this.element = htmlElement; }
    get(){ return this.element.innerText; }
    set(text){ this.element.textContent = text; }
    getHTML(){ return this.element.innerHTML; }
    setHTML(html){ this.element.innerHTML = html; }
}

var typeInput = null;
var protoInput = null;
var payloadInput = null;
var dataInput = null;
var protoRoot = null;

document.addEventListener('DOMContentLoaded', e => {
    typeInput = {
        get(){ return document.getElementById('type').value; },
        add(option){
            var newHTML = '<option value="' + option + '">' + option + '</option>';
            document.getElementById('type').innerHTML += newHTML;
        },
        clear(){ document.getElementById('type').innerHTML= ''; }
    };
    protoInput = new CodeBox(document.getElementById('proto'));
    payloadInput = new CodeBox(document.getElementById('payload'));
    dataInput = new CodeBox(document.getElementById('data'));

    document.getElementById('proto').addEventListener('input', e => {
        document.getElementById('encode').disabled = true;
        document.getElementById('decode').disabled = true;
    });

    load();
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

function encode(){
    var payload = eval('(function(){' + payloadInput.get() + '})()');
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
}

function load(){
    protoInput.set(localStorage.getItem('proto'));
    payloadInput.set(localStorage.getItem('payload'));
}

function compile(callback){
    var errMsg = null;
    try{
        var root = protobuf.parse(protoInput.get()).root;
    }
    catch(err){
        errMsg = err;
    }
    
    if(errMsg){
        dataInput.set(errMsg);
    }
    else {
        typeInput.clear();
        Object.keys(root.nested).forEach(type => typeInput.add(type));
        protoRoot = root;
        document.getElementById('encode').disabled = false;
        document.getElementById('decode').disabled = false;
    }
}
