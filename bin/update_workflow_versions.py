#!/usr/bin/env python3

import json
import os
import re
import shlex
import time
from contextlib import suppress
from subprocess import Popen, PIPE, TimeoutExpired
from threading import Timer

from ruamel.yaml import YAML

SIGINFO = 29
dir_path = os.path.dirname(os.path.realpath(__file__))
yaml = YAML()
workflows = ["tests.yml", "tests_output.yml"]
result = []
resultJson = {}


def create_workflow_files():
    for mod in workflows:
        with open(os.path.realpath(os.path.join(dir_path, '../.github/workflows', mod)), "r") as wrf:
            code = yaml.load(wrf)
            code['jobs']['build']['strategy']['matrix']['include'] = result
            with open(os.path.realpath(os.path.join(dir_path, '../.github/workflows', mod)), "w") as wwf:
                yaml.dump(code, wwf)


def create_versions_json_file():
    with open(os.path.realpath(os.path.join(dir_path, '../versions.json')), "w") as vwf:
        json_dump = json.dumps(resultJson)
        vwf.write(json_dump)


def create_versions_commands_json_file(commandsParamsList: dict):
    with open(os.path.realpath(os.path.join(dir_path, '../src/support/versions.json')), "w") as vwf:
        json_dump = json.dumps(commandsParamsList, indent=2, sort_keys=True)
        vwf.write(json_dump)


def kill_gracefully(process, timeout=2):
    """
    Try terminating the process first (uses SIGTERM; which allows it to potentially shutdown gracefully). If the process
    does not exit within the given timeout, the process is killed (SIGKILL).

    :param process: The process to terminate or kill
    :type process: subprocess.Popen
    :param timeout: Number of seconds to wait after terminate before killing
    :type timeout: int
    :return: The exit code, stdout, and stderr of the process
    :rtype: (int, str, str)
    """
    try:
        with suppress(ProcessLookupError):
            process.terminate()
        stdout, stderr = process.communicate(timeout=timeout)

    except TimeoutExpired:
        _, stdout, stderr = kill_hard(process)

    return process.returncode, stdout, stderr


def kill_hard(process):
    """
    Kill the specified process immediately using SIGKILL.

    :param process: The process to terminate or kill
    :type process: subprocess.Popen
    :return: The exit code, stdout, and stderr of the process
    :rtype: (int, str, str)
    """
    with suppress(ProcessLookupError):
        if not is_windows():
            process.send_signal(SIGINFO)  # this assumes a debug handler has been registered for SIGINFO
            time.sleep(1)  # give the logger a chance to write out debug info
        process.kill()

    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


def run(cmd, timeout_sec):
    proc = Popen(shlex.split(cmd), stdout=PIPE, stderr=PIPE, encoding="utf-8")
    timer = Timer(timeout_sec, proc.kill)
    try:
        timer.start()
        stdout, stderr = proc.communicate()
    finally:
        timer.cancel()
    return proc.returncode, stdout, stderr


def is_windows():
    """
    :return: Whether ClusterRunner is running on Windows or not>
    :rtype: bool
    """
    return os.name == 'nt'


def unique(seq):
    seen = set()
    seen_add = seen.add
    return [x for x in seq if not (x in seen or seen_add(x))]


def create_versions_typescript_files(digists=None):
    output_json = {}
    for version in result:
        library = version['LIBRARY']
        library_version = version['VERSION']

        print("-----------------")
        cmd = os.path.realpath(
            os.path.join(
                dir_path, '../openssl/',
                "%s_v%s" % (library, library_version),
                "bin/openssl"
            ))
        print(library, library_version, cmd)

        _, stdout, stderr = run(cmd + " help", 10)
        # _, stdout2, stderr2 = run(cmd + " help", 10)
        output = stdout + "\n" + stderr  # + "\n" + stdout2 + "\n" + stderr2
        # print(output)
        resultCommands = []
        digistsList = []
        ciphersList = []
        onlyCommandsStart = False
        onlyCommandsEnd = False

        for row in output.split('\n'):
            if row.strip() == "":
                continue
            print("-->", row, row.startswith('Standard commands'), onlyCommandsStart,
                  row.startswith('Message Digest commands'), onlyCommandsEnd)

            if not onlyCommandsStart and not onlyCommandsEnd and row.startswith('Standard commands'):
                onlyCommandsStart = True
                continue
            if not onlyCommandsEnd and row.startswith('Message Digest commands'):
                onlyCommandsEnd = True
                if onlyCommandsStart and onlyCommandsEnd:
                    onlyCommandsStart = False
                    onlyCommandsEnd = False
                continue
            if not onlyCommandsStart and not onlyCommandsEnd:
                continue

            commandsList = row.split('  ')
            filter_object = filter(lambda x: x != "", commandsList)
            commandsList = list(filter_object)
            # print("CommandsList")
            # print(commandsList)
            for x in commandsList:
                if x == "error":
                    continue
                resultCommands.append(x.strip())

        # print(resultCommands)
        # print("+++++++++++++++++")
        onlyCommandsStart = False
        onlyCommandsEnd = False
        for row in output.split('\n'):
            if row.strip() == "":
                continue
            # print("-->", row, row.startswith('Standard commands'), onlyCommandsStart,
            #      row.startswith('Message Digest commands'), onlyCommandsEnd)

            if not onlyCommandsStart and not onlyCommandsEnd and row.startswith('Message Digest commands'):
                onlyCommandsStart = True
                continue
            if not onlyCommandsEnd and row.startswith('Cipher commands'):
                onlyCommandsEnd = True
                if onlyCommandsStart and onlyCommandsEnd:
                    onlyCommandsStart = False
                    onlyCommandsEnd = False
                continue
            if not onlyCommandsStart and not onlyCommandsEnd:
                continue

            commandsList = row.split('  ')
            filter_object = filter(lambda x: x != "", commandsList)
            commandsList = list(filter_object)
            # print("CommandsList")
            # print(commandsList)
            for x in commandsList:
                digistsList.append(x.strip())

        # print(digistsList)
        # print("+++++++++++++++++")
        onlyCommandsStart = False
        onlyCommandsEnd = False
        for row in output.split('\n'):
            if row.strip() == "":
                continue
            # print("-->", row, row.startswith('Standard commands'), onlyCommandsStart,
            #      row.startswith('Message Digest commands'), onlyCommandsEnd)

            if not onlyCommandsStart and not onlyCommandsEnd and row.startswith('Cipher commands'):
                onlyCommandsStart = True
                continue
            if onlyCommandsStart and onlyCommandsEnd:
                continue
            if not onlyCommandsStart and not onlyCommandsEnd:
                continue

            commandsList = row.split('  ')
            filter_object = filter(lambda x: x != "", commandsList)
            commandsList = list(filter_object)
            # print("CommandsList")
            # print(commandsList)
            for x in commandsList:
                ciphersList.append(x.strip())

        # print(ciphersList)
        # print("+++++++++++++++++")
        commandsParamsList = {}
        onlyCommandsStart = False
        onlyCommandsEnd = False
        for command in resultCommands:
            if command.strip() == "":
                continue
            commandsParamsList.setdefault(command, [])
            # print(cmd + " " + command + " -help")
            exitcode, stdout, stderr = run(cmd + " " + command + " help", 1)
            exitcode2, stdout2, stderr2 = run(cmd + " " + command + " -help", 1)
            # print("---->>", command, exitcode)

            output = stdout + "\n" + stderr + "\n" + stdout2 + "\n" + stderr2

            for row in output.split('\n'):
                if row.strip() == "":
                    continue
                # print(row)
                # print("COMMAND PARAMETER -->", row, row.startswith('Standard commands'), onlyCommandsStart,
                #      row.startswith('Message Digest commands'), onlyCommandsEnd)
                if row.startswith('unknown option') or row.__contains__('Use -help for summary') or \
                        row.__contains__('No operation option') or row.__contains__("Usage:") or \
                        row.startswith("0:error:") or row.__contains__("Can't parse \"help\"") or \
                        row.__contains__("Extra arguments given.") or row.startswith("Failed to process value") or \
                        row.startswith("Skipping help, can't write") or row.__contains__("connect:errno") or \
                        row.startswith("Can't open") or row.startswith("unable to load server certificate") or \
                        row.__contains__("Unknown algorithm help"):
                    continue
                # if not onlyCommandsStart and not onlyCommandsEnd and row.startswith('Cipher commands'):
                #     onlyCommandsStart = True
                #     continue
                # if onlyCommandsStart and onlyCommandsEnd:
                #     continue
                # if not onlyCommandsStart and not onlyCommandsEnd:
                #     continue

                commandsList = row.split('  ')
                filter_object = filter(lambda x: x != "", commandsList)
                commandsList = list(filter_object)
                # print("CommandsList")
                # print(commandsList)
                for x in commandsList:
                    commandsParamsList[command].append(x.strip())

            commandsParamsList[command] = unique(commandsParamsList[command])
            print(commandsParamsList[command])
        print("+++++++++++++++++")
        # print("-----------------")
        output_json.setdefault(library, {})
        resultCommandsList = list([x.strip() for x in resultCommands if x.strip()])
        digistsList2 = list([x.strip() for x in digistsList if x.strip()])
        ciphersList2 = list([x.strip() for x in ciphersList if x.strip()])
        output_json[library][library_version] = {"commands": list(unique(resultCommandsList)),
                                                 'digits': list(unique(digistsList2)),
                                                 'ciphersAndEncoding': list(unique(ciphersList2)),
                                                 'commandArguments': commandsParamsList}
        # print(output_json)
        # filename = Path(
        #     os.path.realpath(
        #         os.path.join(
        #             dir_path, '../src/versions/', "%s_%s.ts" % (
        #                 version['LIBRARY'], version["VERSION"]
        #             )
        #         )
        #     )
        # )
        # filename.touch(exist_ok=True)
    # t1 = None
    # t2 = None
    # diff_result = {}
    # for lib in output_json:
    #     for vers in output_json[lib]:
    #         t1 = output_json[lib][vers]
    #         for lib2 in output_json:
    #             for vers2 in output_json[lib2]:
    #                 t2 = output_json[lib2][vers2]
    #                 if t1 == t2:
    #                     continue
    #                 ddiff = DeepDiff(t1, t2, ignore_order=True, verbose_level=0)
    #                 diff_result.setdefault("%s_%s" % (lib, vers), {})
    #                 diff_result["%s_%s" % (lib, vers)].setdefault("%s_%s" % (lib2, vers2), ddiff.to_dict())
    #
    # output_json['_diff'] = diff_result
    create_versions_commands_json_file(output_json)


with open(os.path.join(dir_path, '../versions')) as vf:
    lines = vf.readlines()
    for lv in [x.strip().split(':') for x in lines]:
        result.append({"LIBRARY": lv[0], "VERSION": lv[1], "OPENSSL_DIR": "/openssl"})
        if lv[0].upper() not in resultJson:
            resultJson[lv[0].upper()] = {}
        resultJson[lv[0].upper()][re.sub("[^0-9.]+", "", lv[1])] = True
        create_workflow_files()
    create_versions_json_file()
    create_versions_typescript_files()
