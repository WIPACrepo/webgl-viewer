#!/bin/bash
set -e

mkdir -p static/tuning
mkdir -p i3-data/cascade2
scp data.icecube.wisc.edu:/data/user/nwandkowsky/outreach/masterclass/*/plots/*.png static/tuning/
scp data.icecube.wisc.edu:/data/user/dschultz/event_viewer_data/*.i3* i3-data/
scp data.icecube.wisc.edu:/data/user/dschultz/event_viewer_data/cascade2/*.i3* i3-data/cascade2/
