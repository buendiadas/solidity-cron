# from TRL folder

# START rabbitqm

#export TRAVIS_BUILD_DIR=/Users/boss/git/frontier/trl-project/TRL
echo "----------------------------------"
echo "----------------------------------"
echo "----------------------------------"
echo "--- STARTING INTEGRATION TEST ----"
echo "----------------------------------"
export PLAYGROUND_FRONTIERJS=$TRAVIS_BUILD_DIR/../frontierjs-dev
export PLAYGROUND_TRLLISTENER=$TRAVIS_BUILD_DIR/../trllistener-dev
export PROXY_ADDR_PATH=$TRAVIS_BUILD_DIR/../trlProxyAddress.json

export INTEGRATION_TEST=1

# setup frontierjs
mkdir $PLAYGROUND_FRONTIERJS
echo "Going to playground!"
( cd $PLAYGROUND_FRONTIERJS && pwd )

#git clone git@github.com:Frontier-project/frontier-js.git $PLAYGROUND_FRONTIERJS
git clone --single-branch -b FRN-130/test/continuos-integration-trl https://github.com/Frontier-project/frontier-js.git $PLAYGROUND_FRONTIERJS
( cd $PLAYGROUND_FRONTIERJS && echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc )
( cd $PLAYGROUND_FRONTIERJS && npm install )
#( cd $PLAYGROUND_FRONTIERJS && npm run start:testrpc & )
#( cd $PLAYGROUND_FRONTIERJS && npm run test )
#Clean build
#( cd $PLAYGROUND_FRONTIERJS && rm -r dist )
#( cd $PLAYGROUND_FRONTIERJS && npm run build-dist )

# rm -r dist
# #pass env variable here!
# npm run build-dist

# # setup trl-listener

 mkdir $PLAYGROUND_TRLLISTENER 
 #git clone git@github.com:Frontier-project/trl-listener.git $PLAYGROUND_TRLLISTENER
 git clone https://github.com/Frontier-project/trl-listener.git $PLAYGROUND_TRLLISTENER
 
 ( cd $PLAYGROUND_TRLLISTENER && echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc )
 ( cd $PLAYGROUND_TRLLISTENER && npm install )
 ( cd $PLAYGROUND_TRLLISTENER && npm link $PLAYGROUND_FRONTIERJS )
 ( cd $PLAYGROUND_TRLLISTENER && npm run build )
 ( cd $PLAYGROUND_TRLLISTENER && npm run start:testrpc & )
 ( cd $PLAYGROUND_TRLLISTENER && npm run test )

export INTEGRATION_TEST=0
cd $TRAVIS_BUILD_DIR
echo "Finished small-setup"