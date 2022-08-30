const axios = require('axios');
const { execFile } = require('node:child_process');

const server_base_url = `http://localhost:8087`;

(async()=>{

    await setupServer();

    const obj = await listObjects();  
    console.log(obj);

})();

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
