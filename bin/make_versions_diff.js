#!/usr/bin/env node
/*
 * Copyright (c) 2022. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.
 */

const fs = require('fs')
const path_lib = require("path")
const json_diff = require("deep-object-diff")

const my_JSON_File = fs.readFileSync(path_lib.join(__dirname, '/../src/support/versions.json'), {encoding: 'utf8'})
const myJSON = JSON.parse(my_JSON_File)

for (let lib in myJSON) {
  if (lib === '_diff') continue
  for (let vers in myJSON[lib]) {
    const t1 = myJSON[lib][vers]

    for (let lib2 in myJSON) {
      if (lib2 === '_diff') continue
      for (let vers2 in myJSON[lib2]) {
        if (lib === lib2 && vers === vers2) continue

        const t2 = myJSON[lib2][vers2]

        console.log(`${lib}_v${vers} vs ${lib2}_v${vers2}`, json_diff.detailedDiff(t1, t2))


      }
    }
  }
}
