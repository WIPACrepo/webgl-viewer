FROM icecube/icetray:combo-stable-slim-ubuntu18.04-20190710-211805

# install python packages
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python-tornado

# create an icecube user
RUN adduser icecube --disabled-password
USER icecube
WORKDIR /home/icecube

# copy local files
COPY . /home/icecube/

# provide the entry point to run commands
ENTRYPOINT ["/bin/bash", "/usr/local/icetray/env-shell.sh", "exec"]
CMD ["python", "main.py", "--event-viewer-data", "/home/icecube/i3-data", "--port", "8080", "--no-browser", "--loglevel", "info"]
