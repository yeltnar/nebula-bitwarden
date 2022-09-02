const axios = require('axios');
const { execFile } = require('node:child_process');
const fs = require('fs/promises');

const action = process.argv[2];

// don't need to change this, cuz it will be in the container 
const server_base_url = `http://localhost:8087`;

const nebula_dir = "/nebula";
const id_note_location = "/app/config/nebula_id";
const file_out_dir = "/app/config/";

(async()=>{

    if( action===undefined || action==='' ){
        console.error('First argument should be the function to run');
        process.exit();
    }else{
        console.log({action});
    }

    await setupServer();

    if( action === "create_note" ){
        console.log('create_note')
    }else if( action === "getNebulaNote" ){
        const note_id = (await fs.readFile(id_note_location)).toString();
        console.log(note_id);
        const note = await getNebulaNote(note_id);
        console.log(note);  
    }else if( action === "createNebulaNote" ){

        const file_list = await getNebulaLocalFiles(nebula_dir);

        const item = await createNebulaNote(file_list);
        const id = item.data.id;

        await fs.writeFile(id_note_location,id);
    }else if( action === 'writeNebulaNoteToFs' ){
        const note_id = (await fs.readFile(id_note_location)).toString();
        console.log(note_id);
        const note_obj = (await getNebulaNote(note_id)).data;
        const nebula_info = JSON.parse(note_obj.notes);

        await Promise.all(nebula_info.map(async(cur)=>{
            console.log(cur.name);
            await fs.writeFile(`${file_out_dir}${cur.name}`, cur.contents)
        }));
    }

    // const obj = await listObjects();  
    // console.log(obj);

    process.exit();
})();

// get the nebula files, but not folders
async function getNebulaLocalFiles(nebula_dir){

    let file_list = await Promise.all((await fs.readdir(nebula_dir)).map(async(cur)=>{
        const file_path = `${nebula_dir}/${cur}`;
        const is_file = (await fs.lstat(file_path)).isFile();

        if(is_file){
            const contents = (await fs.readFile(file_path)).toString();
            return {
                contents,
                name:cur
            }
        }
    }));

    file_list = file_list.filter((cur,i,arr)=>cur!==undefined);

    return file_list;
}

// get the note by id
async function getNebulaNote(id){
    const x = await axios.get(
        server_base_url + `/object/item/${id}`
    )
    .catch((e)=>{
        console.log('axios err');
        console.log(e);
        console.log(Object.keys(e.response));
        console.log(e.response.data);
        throw new Error('axios error')
    })
    .then((x)=>{
        return x;
    });
    return x.data;
}

async function createNebulaNote(file_list){

    const x = await axios.post(
        server_base_url + '/object/item',
        {
            "organizationId": null,
            "collectionId": null,
            // "folderId": "1f8c544a-a33b-46d9-af7c-ae2800f4a9c8",
            "type": 2,
            "name": "Nebula device info",
            "notes": JSON.stringify(file_list),
            "favorite": false,
            "fields": [],
            "secureNote": {
                "type": 0
            },
            "reprompt": 0
        },
        {
            headers: {
                // 'application/json' is the modern content-type for JSON, but some
                // older servers may use 'text/json'.
                // See: http://bit.ly/text-json
                'content-type': 'application/json'
            }
        }
    )
    .catch((e)=>{
        console.log('axios err');
        console.log(e);
        console.log(Object.keys(e.response));
        console.log(e.response.data);
        throw new Error('axios error')
    })
    .then((x)=>{
        return x;
    });
    return x.data;
}

async function listObjects(){
    const x = await axios.get(server_base_url+'/list/object/items')
    .catch(()=>{
        console.log('axios err');
        throw new Error('axios error')
    });
    return x.data;
}

async function setupServer(){
    const child_process = execFile('./init.sh',(err, stdout, stderr)=>{});

    child_process.stderr.on('data', function (data) {
        const s = data.toString();
        console.log(s);
    });

    child_process.stdout.on('data', function (data) {
        const s = data.toString();
        console.log(s);
    });
    
    await waitForServer();
}

function timeoutPromise(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

async function waitForServer(  ){

    let count=0
    const max_tries = 30;

    while( !(await serverUp()) && count < max_tries ){

        count++;
        console.log(`waitForServer ${count}`)

        await timeoutPromise(1000);

        if(count >= max_tries ){
            throw new Error('Break; too many loops before bw server is up');
        }
    }

    async function serverUp(){
        let r = axios.get(`${server_base_url}/status`)
        .then((r)=>{
            return true
        }).catch((r)=>{
            return false;
        });
        return r;
    }
}
