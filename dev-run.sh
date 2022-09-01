tag=bw-cli-docker

docker build -t $tag . && 
docker run -it \
-v$PWD/config:/app/config \
-v$PWD/src:/app/src \
-v$PWD/nebula:/nebula \
-v$PWD/package.json:/app/package.json \
$tag node src/app.js "$1"