#!/usr/bin/env python

import sys

if sys.version_info < (2, 7):
    print("This script requires at least Python 2.7.")
    print("Please, update to a newer version: http://www.python.org/download/releases/")
#   exit()

import argparse
import json
import os
import shutil
import glob

from io import open, StringIO

from slimit import minify

def main(argv=None):


    outputs = {
        'static/viewer.min.js':[
            'js_src/Blob.js',
            'js_src/FileSaver.js',
            'js_src/csvWriter.js',
            'js_src/util.js',
            'js_src/i3_raw.js',
            'js_src/vector3d.js',
            'js_src/viewer.js',
            ]+glob.glob('js_src/artists/*.js')+[
            'js_src/viewer-wrapper.js',
        ],
        'static/three.min.js':[
            'js_src/three.js',
            'js_src/Projector.js',
            'js_src/CanvasRenderer.js',
            'js_src/Detector.js',
        ],
        'static/d3.min.js':[
            'js_src/d3.js',
        ],
        'static/icetop.min.js':[
            'js_src/icetop/functions.js',
            'js_src/icetop/icetop.js',
        ],
    }

    for output in outputs:

        # get timestamps to check if we need to minify
        try:
            latest_output = os.path.getmtime(output)
            latest_src = None
            for filename in outputs[output]:
                m = os.path.getmtime(filename)
                if not latest_src or m > latest_src:
                    latest_src = m
        except Exception:
            pass
        else:
            if latest_src and latest_output and latest_src <= latest_output:
                print(' * Skipping ' + output)
                continue

        print(' * Building ' + output)

        # merge
        tmp = StringIO()

        for filename in outputs[output]:
            tmp.write(u'// File:' + filename)
            tmp.write(u'\n\n')
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    if filename.endswith(".glsl"):
                        tmp.write(u'THREE.ShaderChunk[ \'' + os.path.splitext(os.path.basename(filename))[0] + u'\'] = "')
                        tmp.write(f.read().replace('\n','\\n'))
                        tmp.write(u'";\n\n')
                    else:
                        tmp.write(f.read())
                        tmp.write(u'\n')
            except:
                print('error reading/writing file '+filename)
                raise

        # minify
        try:
            with open(output, 'w', encoding='utf-8') as f:
                mangle = True
                if 'd3' in output or 'icetop' in output:
                    mangle = False
                f.write(minify(tmp.getvalue(), mangle=mangle))
        except Exception as e:
            print(e)
            os.unlink(output)
        if not os.path.exists(output):
            print("Minification failed")
            with open(output, 'w', encoding='utf-8') as f:
                f.write(tmp.getvalue())

        tmp.close()


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
