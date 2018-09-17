# from TRL folder

# START rabbitqm

#export TRAVIS_BUILD_DIR=/Users/boss/git/frontier/trl-project/TRL
export PLAYGROUND=$TRAVIS_BUILD_DIR/frontierjs-dev
export PROXY_ADDR_PATH=$TRAVIS_BUILD_DIR/../trlProxyAddress.json

# setup frontierjs
mkdir $PLAYGROUND

#git clone git@github.com:Frontier-project/frontier-js.git $PLAYGROUND
git clone https://github.com/Frontier-project/frontier-js.git $PLAYGROUND

( cd $PLAYGROUND && npm install )
( cd $PLAYGROUND && npm run start:testrpc & )
( cd $PLAYGROUND && npm run test )
rm -r $PLAYGROUND
echo "Finished small-setup"


# rm -r dist
# #pass env variable here!
# npm run build-dist

# # setup trl-listener

# mkdir $TRAVIS_BUILD_DIR/../trl-listener-dev && cd $TRAVIS_BUILD_DIR/../trl-listener-dev
# git clone git@github.com:Frontier-project/trl-listener.git
# cd $TRAVIS_BUILD_DIR/../trl-listener-dev/trl-listener
# npm install
# npm link $TRAVIS_BUILD_DIR/../frontierjs-dev/frontier-js
# npm run build
# npm run start:testrpc &
# npm run test

# #ganache-cli &
# #npm run test
