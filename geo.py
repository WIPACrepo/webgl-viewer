"""Parse a GCD file and return the geometry"""
import os
from icecube import icetray,dataclasses,dataio

def gettype(omtype):
    if omtype == dataclasses.I3OMGeo.AMANDA:
        return 0
    elif omtype == dataclasses.I3OMGeo.IceCube:
        return 1
    elif omtype == dataclasses.I3OMGeo.IceTop:
        return 2
    else:
        return 3

def getposition(pos):
    return {'x':pos.x,'y':pos.y,'z':pos.z}


cache = {}

def parseGCD(filename):
    if filename in cache:
        if os.path.getmtime(filename) <= cache[filename]['mtime']:
            # use cached data
            print 'cache hit for',filename
            return cache[filename]['output']
    
    i3file = dataio.I3File(filename)
    
    frame = i3file.pop_frame()

    geomap = frame['I3Geometry'].omgeo
    
    fiducial = None
    if 'FiducialDOMs' in frame:
        fiducial = frame['FiducialDOMs']
    
    # make dict of strings: {om: {pmt: {type,position,orientation}}}
    output = {}
    strings = set()
    for om in geomap.keys():
        #print 'processing %s'%om
        if om.string not in strings:
            strings.add(om.string)
        value = geomap[om]
        ret = {'type':gettype(value.omtype),
               'pos':getposition(value.position),
              }
        if fiducial and om in fiducial:
            ret['fiducial'] = True
        if om.string not in output:
            output[om.string] = {}
        if om.om not in output[om.string]:
            output[om.string][om.om] = {}
        try:
            output[om.string][om.om][om.pmt] = ret
        except:
            raise Exception('error with %s'%om)
    print strings
    # add to cache
    cache[filename] = {'mtime':os.path.getmtime(filename),
                       'output':output
                      }
    
    return output


if __name__ == '__main__':
    import sys
    import json
    if len(sys.argv) < 2:
        raise Exception('need a GCD filename as an argument')
    ret = parseGCD(sys.argv[1])
    
    print ret[1]
    
    json.dump(ret,open('GCD.json','w'))
