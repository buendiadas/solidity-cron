echo "----------------------------------"
echo "--- STARTING INTEGRATION TEST ----"
echo "----------------------------------"

export PLAYGROUND_TRLLISTENER=$TRAVIS_BUILD_DIR/../trllistener-dev
export PROXY_ADDR_PATH=$TRAVIS_BUILD_DIR/../trlProxyAddress.json

export INTEGRATION_TEST=1


 mkdir $PLAYGROUND_TRLLISTENER 
 #git clone git@github.com:Frontier-project/trl-listener.git $PLAYGROUND_TRLLISTENER
 git clone https://github.com/Frontier-project/trl-listener.git $PLAYGROUND_TRLLISTENER
 
 ( cd $PLAYGROUND_TRLLISTENER && echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc )
 ( cd $PLAYGROUND_TRLLISTENER && npm install )
 ( cd $PLAYGROUND_TRLLISTENER && npm run start:testrpc-trl > ganache-trlintegration-logs.txt & )