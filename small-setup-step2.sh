echo "----------------------------------"
echo "----      --- STEP 2 ---    ------"
echo "----------------------------------"

( cd $PLAYGROUND_TRLLISTENER && npm run test )

export INTEGRATION_TEST=0
cd $TRAVIS_BUILD_DIR
echo "Finished small-setup"