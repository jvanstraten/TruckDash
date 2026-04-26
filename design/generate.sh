#!/usr/bin/env sh

set -xe

blender -b design.blend --python-text export
