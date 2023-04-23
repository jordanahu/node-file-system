let fs = require("fs/promises");
const { EventEmitter } = require("stream");

class CommandEmitter extends EventEmitter{
    constructor(){
        super()
    }
}


const DELETE_COMMAND = "delete";
const WRITE_COMMAND = "write";
const RENAME_COMMAND = "rename";
const APPEND_COMMAND = "append";
const commandEmitter = new CommandEmitter();




commandEmitter.on("change", async (fileName)=>{
    try{
        
        let content = await readFile(fileName);
        
        if(content.includes(DELETE_COMMAND)) commandEmitter.emit("delete", content)
        if(content.includes(WRITE_COMMAND)) commandEmitter.emit("write", content)
        if(content.includes(RENAME_COMMAND)) commandEmitter.emit("rename", content)
        if(content.includes(APPEND_COMMAND)) commandEmitter.emit("append", content)
    
    }catch(error){
        console.log("the error is, ", error)
    }
})

commandEmitter.on("delete", async (content)=>{

     try{

        let {destination} = formatContent(content);
        await fs.unlink(destination);

    }catch(error){
        console.log("error deleting file is, ", error)
    }
    
})

commandEmitter.on("write", async(content)=>{
    try{

        let {destination, text} = formatContent(content);
        await fs.writeFile(destination, text);
        
    }catch(error){
        
        console.log("error deleting file is, ", error)
    }
})
commandEmitter.on("rename", async(content)=>{
    try{
    
        let {destination:newName, text:oldName} = formatContent(content);
        await fs.rename(oldName, newName);
        
    }catch(error){
        
        console.log("error renaming file is, ", error)
    }
    
})

commandEmitter.on("append", async(content)=>{
    let fileHandler;
    try{
        let {destination, text} = formatContent(content);

        fileHandler = await fs.open(destination, "a");
        await fileHandler.appendFile(text);
    }catch(error){
        console.log("error while appending is, ", error)
    }finally{
        fileHandler.close()
    }
})

function formatContent(content){
    let words = content.split(/\s+/);
    let destination = words.at(-1);
    if(words.length == 2) return {destination}
    let text = "";
    for(let word of words.slice(1, -1)){

        if(word != "to"){
            text+=` ${word}`;
        }
    }

    text+="\n";

    return {destination, text:text.trim()}
}

async function createFile(){

}

async function readFile(fileName){
    let fileHandler;
    try{
        fileHandler = await fs.open(fileName, "r");
        let size = (await fileHandler.stat()).size;
        let buf = Buffer.alloc(size);

        await fileHandler.read(buf, {offset:0, position:0,length:size});
        return buf.toString()
    }catch(error){
        console.log("the error reading is, ", error)
    }finally{
       await fileHandler.close()
    }
}



async function watchFile(){
    try{
        let watchedFileInfo = fs.watch("./command.txt");
        for await (let info of watchedFileInfo){
            if(info.eventType == "change"){
                commandEmitter.emit("change", info.filename);
            }
        }

    }catch(error){
        console.log("the error watching is, ", error)
    }
}



watchFile()


