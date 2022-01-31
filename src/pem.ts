import {name as ca_name} from "./commands/ca"
import {name as convert_name} from "./convert"
import {debug} from "./debug"
import {name as helper_name} from "./helper"
import {getConfig as getConfig, name as openssl_name} from "./openssl"


/**
 *
 */
async function run(): Promise<void> {
  console.log("Versions", getConfig())
  console.log(convert_name)
  console.log(ca_name)
  console.log(helper_name)
  console.log(openssl_name)
  debug("Versions", getConfig())
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 1500)
  })
  console.log("Versions", getConfig())
}

run()
