import os
import subprocess
import sys

def run_command(command, cwd=None):
    """
    Run a shell command in a specified directory and print the output.
    """
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, cwd=cwd)
    while True:
        output = process.stdout.readline()
        if not output and process.poll() is not None:
            break
        if output:
            print(output.strip().decode())
            