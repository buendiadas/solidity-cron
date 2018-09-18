# from TRL folder

# START rabbitqm

export TRAVIS_BUILD_DIR=/Users/boss/git/frontier/trl-project/TRL
export PROXY_ADDR_PATH=$TRAVIS_BUILD_DIR/../trlProxyAddress.json


# setup frontierjs
mkdir $TRAVIS_BUILD_DIR/../frontierjs-dev && cd $TRAVIS_BUILD_DIR/../frontierjs-dev
git clone git@github.com:Frontier-project/frontier-js.git
cd $TRAVIS_BUILD_DIR/../frontierjs-dev/frontier-js
npm install
rm -r dist
#pass env variable here!
npm run build-dist

# setup trl-listener

mkdir $TRAVIS_BUILD_DIR/../trl-listener-dev && cd $TRAVIS_BUILD_DIR/../trl-listener-dev
git clone git@github.com:Frontier-project/trl-listener.git
cd $TRAVIS_BUILD_DIR/../trl-listener-dev/trl-listener
npm install
npm link $TRAVIS_BUILD_DIR/../frontierjs-dev/frontier-js
npm run build
npm run start:testrpc &
npm run test

#ganache-cli &
#npm run test
