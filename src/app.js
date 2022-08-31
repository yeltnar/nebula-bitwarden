const axios = require('axios');
const { execFile } = require('node:child_process');

const action = process.argv[2];

// don't need to change this, cuz it will be in the container 
const server_base_url = `http://localhost:8087`;

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
    }else if( action === "createItem" ){
        const item = await createItem();
        console.log(item);
    }

    // const obj = await listObjects();  
    // console.log(obj);

    process.exit();
})();

async function createItem(){
    const x = await axios.post(
        server_base_url + '/object/item',
        {
            "organizationId": null,
            "collectionId": null,
            // "folderId": "1f8c544a-a33b-46d9-af7c-ae2800f4a9c8",
            "type": 2,
            "name": "Steps to World Domination",
            "notes": "1) Use Bitwarden, 2) Profit",
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
