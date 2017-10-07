const deployOnce = require('../node_modules/travis-deploy-once')

const makeTest = async function () {
  let result

  try {
    // Options can also be set as environment variables with the same name
    result = await deployOnce(
      {
        // Object passed to https://github.com/pwmckenna/node-travis-ci
        travisOpts: {pro: false},
        // GitHub oAuth token
        GH_TOKEN: process.env.GH_TOKEN,
        // Want to control which job is the build leader?
        // Set your preferred job id
        BUILD_LEADER_ID: 1
      }
    )
  } catch (err) {
    // something went wrong, and err will tell you what
    console.log(err)
  }

  if (result === true) {
    process.exitCode = 0
    console.log(0)
  }
  if (result === false) {
    process.exitCode = 1
    console.log(1)
  }
  if (result === null) {
    process.exitCode = 1
    console.log(1)
  }
  return 0
}

makeTest()
