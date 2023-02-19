import importlib
import sys

from pyteal_helpers import program

from to_do_contract import *

if __name__ == "__main__":
    mod = sys.argv[1]

    try:
        approval_out = sys.argv[2]
    except IndexError:
        approval_out = None

    try:
        clear_out = sys.argv[3]
    except IndexError:
        clear_out = None

    # contract = importlib.import_module(mod)

    if approval_out is None:
        print(program.application(approval()))
    else:
        with open(approval_out, "w") as h:
            h.write(program.application(approval()))

    if clear_out is not None:
        with open(clear_out, "w") as h:
            h.write(program.application(clear()))
