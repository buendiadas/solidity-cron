echo "----------------------------------"
echo "----      --- STEP 2 ---    ------"
echo "----------------------------------"

( cd $TRAVIS_BUILD_DIR && truffle migrate --reset --compile-all --network development_integration_test )
( cd $PLAYGROUND_TRLLISTENER && npm run test-trl-int)

export INTEGRATION_TEST=0
cd $TRAVIS_BUILD_DIR
echo "Finished small-setup"