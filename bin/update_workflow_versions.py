#!/usr/bin/env python3

import os

from ruamel.yaml import YAML

dir_path = os.path.dirname(os.path.realpath(__file__))
yaml = YAML()
workflows = ["build_cache.yml", "tests.yml", "tests_output.yml"]

with open(os.path.join(dir_path, '../versions')) as vf:
    lines = vf.readlines()
    result = []
    for lv in [x.strip().split(':') for x in lines]:
        result.append({"LIBRARY": lv[0], "VERSION": lv[1], "OPENSSL_DIR": "/openssl"})
        for mod in workflows:
            with open(os.path.realpath(os.path.join(dir_path, '../.github/workflows', mod)), "r") as wrf:
                code = yaml.load(wrf)
                code['jobs']['build']['strategy']['matrix']['include'] = result
                with open(os.path.realpath(os.path.join(dir_path, '../.github/workflows', mod)), "w") as wwf:
                    yaml.dump(code, wwf)
