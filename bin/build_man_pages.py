#!/usr/bin/env python3
#  Copyright (c) 2022. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
#  Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
#  Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
#  Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
#  Vestibulum commodo. Ut rhoncus gravida arcu.

import json
import re
import shlex
from os import listdir, path as osPath, makedirs
from os.path import isdir, isfile, join, dirname, realpath, splitext
from subprocess import Popen, PIPE
from threading import Timer

import html_to_json

dir_path = dirname(realpath(__file__))
result = []
resultJson = {}

cmd = "man -Tutf8 -M"
cmd2 = "man -Thtml -M"


def run(cmd, timeout_sec):
    proc = Popen(shlex.split(cmd), stdout=PIPE, stderr=PIPE, encoding="utf-8")
    timer = Timer(timeout_sec, proc.kill)
    try:
        timer.start()
        stdout, stderr = proc.communicate()
    finally:
        timer.cancel()
    return proc.returncode, stdout, stderr


def writefiles(dir, file):
    _, stdout, stderr = run(cmd + " " + dir + " " + file, 5)
    with open(join(out, splitext(f)[0] + ".txt"), mode="w", encoding="utf-8") as vf1:
        stdout = re.sub("[\w\W]\x08", "", stdout, flags=re.UNICODE)
        vf1.write(stdout)
    _, stdout, stderr = run(cmd2 + " " + dir + " " + file, 5)
    with open(join(out, splitext(f)[0] + ".html"), mode="w", encoding="utf-8") as vf2:
        vf2.write(stdout)
    output_json = html_to_json.convert(stdout)
    output_json_file = json.dumps(output_json)
    with open(join(out, splitext(f)[0] + ".json"), mode="w", encoding="utf-8") as vf3:
        vf3.write(output_json_file)


with open(osPath.join(dir_path, '../versions')) as vf:
    lines = vf.readlines()
    for lv in [x.strip().split(':') for x in lines]:
        result.append({"LIBRARY": lv[0], "VERSION": lv[1]})

for version in result:
    library = version['LIBRARY']
    library_version = version['VERSION']
    out = realpath(join(dir_path, "..", "man", "%s_v%s" % (library, library_version)))
    makedirs(out, exist_ok=True)

    p1_man_dir = realpath(join(dir_path, "..", "openssl", "%s_v%s" % (library, library_version), "man"))
    p1_dir = realpath(join(p1_man_dir, "man1"))
    if isdir(p1_dir):
        onlyfiles = [f for f in listdir(p1_dir) if isfile(join(p1_dir, f))]
        for f in onlyfiles:
            print(join(p1_dir, f))
            writefiles(p1_man_dir, f)

    p2_man_dir = realpath(join(dir_path, "..", "openssl", "%s_v%s" % (library, library_version), "share", "man"))
    p2_dir = realpath(join(p2_man_dir, "man1"))
    if isdir(p2_dir):
        onlyfiles = [f for f in listdir(p2_dir) if isfile(join(p2_dir, f))]
        for f in onlyfiles:
            print(join(p2_dir, f))
            writefiles(p2_man_dir, f)
