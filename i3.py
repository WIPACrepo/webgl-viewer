"""Parse an I3 file and return frames"""
import os
import math
import logging

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

def parseI3(filename,frame_type='P',keys=None,nframes=1000000,start=0):
    if not filename.startswith('/home/dschultz/event_viewer_data'):
	raise Exception('Unauthorized filename')
    if filename in cache:
        if os.path.getmtime(filename) <= cache[filename]['mtime']:
            # use cached data
            print 'cache hit for',filename
            return cache[filename]['output']

    stream = None
    if frame_type.lower() == 'p':
        stream = icetray.I3Frame.Physics
    elif frame_type.lower() == 'q':
        stream = icetray.I3Frame.DAQ

    i3file = dataio.I3File(filename)

    output = []
    for i in xrange(start+nframes):
        if i3file.more():
            try:
                frame = i3file.pop_frame(stream)
            except:
                break
        else:
            break
        if not frame:
            #print 'not frame'
            break
        if i < start:
            #print 'continue'
            continue
        #print 'running on frame',i
        try:
            ret = ParseFrame(frame,keys).process()
            if ret is not None:
                output.append(ret)
        except Exception as e:
            print e
            raise

    # add to cache
    cache[filename] = {'mtime':os.path.getmtime(filename),
                       'output':output
                      }

    return output

class bytearray_list(object):
    def __init__(self,l):
        self.data = l

class SuperDST(object):
    def __init__(self,l):
        self.data = l

class RecoPulseSeriesMapMask(object):
    def __init__(self,l):
        self.data = l

class RecoPulseSeriesMapUnion(object):
    def __init__(self,l):
        self.data = l

class ParseFrame(object):
    """Convert I3Frame objects to simple format suitable for json"""

    def __init__(self, frame, keys=None):
        self.frame = frame
        self.keys = keys
        self.supported_types = {
            dataclasses.I3SuperDST : self.parse_superdst,
            dataclasses.I3RecoPulseSeriesMap : self.parse_reco_map,
            dataclasses.I3RecoPulseSeriesMapMask : self.parse_reco_map_mask,
            dataclasses.I3RecoPulseSeriesMapUnion : self.parse_reco_map_union,
            dataclasses.I3MCHitSeriesMap : self.parse_mchitseries_map,
            dataclasses.I3Particle : self.parse_i3particle,
            dataclasses.I3Double : self.parse_value,
            dataclasses.I3String : self.parse_value,
            icetray.I3Bool : self.parse_value,
            icetray.I3Int : self.parse_value,
        }

    def process(self):
        ret = {}
        keys = self.frame.keys()
        for key in keys:
            if self.keys and key not in self.keys:
                logging.debug('skipping key %s',key)
                continue
            try:
                obj = self.frame[key]
                if key in ('OfflinePulses','ReextractedInIcePulses') and obj.__class__ == dataclasses.I3RecoPulseSeriesMap:
                    try:
                        ret[key] = self.convert_to_superdst(obj)
                    except:
                        ret[key] = self.supported_types[obj.__class__](obj)
                elif obj.__class__ in self.supported_types:
                    ret[key] = self.supported_types[obj.__class__](obj)
                else:
                    raise Exception('unsupported type: %s',obj.__class__.__name__)
            except Exception as e:
                if 'unregistered class' in str(e) or 'unsupported type' in str(e):
                    continue
                logging.warn('cannot process key %s',key,exc_info=True)
        return ret

    def convert_to_superdst(self,obj):
        if any(True for series in obj.values() if len(series) == 0):
            logging.warn('bad superdst conversion')
            raise Exception('Cannot convert to SuperDST')
        return self.parse_superdst(dataclasses.I3SuperDST(obj))

    def parse_superdst(self,obj):
        return SuperDST(obj.__getstate__()[1])

    def parse_reco_map(self,obj):
        ret = []
        for om in obj.keys():
            pulseseries = obj[om]
            data = []
            for pulse in pulseseries:
                data.append({'time':pulse.time,
                             'charge':pulse.charge,
                            })
            ret.append({'string':om.string,
                        'om':om.om,
                        'pmt':om.pmt,
                        'data':data,
                       })
        return ret

    def parse_reco_map_mask(self,obj):
        return RecoPulseSeriesMapMask(obj.__getstate__()[1])
        mask = bytearray(int(math.ceil(len(obj.bits)/8.0)))
        elements = []
        for i,pulse_series_mask in enumerate(obj.bits):
            if pulse_series_mask:
                mask[i//8] += 1<<(i%8)
                element_mask = bytearray(int(math.ceil(len(pulse_series_mask)/8.0)))
                for j,pulse in enumerate(pulse_series_mask):
                    element_mask[j//8] += 1<<(j%8)
                elements.append(element_mask)
        return {'source':obj.source,
                'mask':mask,
                'elements':bytearray_list(elements),
               }

    def parse_reco_map_union(self,obj):
        return RecoPulseSeriesMapUnion(obj.__getstate__()[1])
        return {'sources':obj.sources}

    def parse_mchitseries_map(self,obj):
        ret = []
        for om in obj.keys():
            series = obj[om]
            if len(series) < 1:
                continue
            data = []
            for pulse in series:
                charge = pulse.charge
                if math.isnan(charge):
                    charge = 1
                data.append({'time':pulse.time,
                             'charge':charge,
                            })
            ret.append({'string':om.string,
                        'om':om.om,
                        'pmt':om.pmt,
                        'data':data,
                       })
        return ret

    def parse_i3particle(self,obj):
        p = obj.pos
        position = {'x':p.x,'y':p.y,'z':p.z}
        d = obj.dir
        direction = {'x':d.x,'y':d.y,'z':d.z}
        if (math.isnan(position['x']) or math.isinf(position['x']) or
            math.isnan(position['y']) or math.isinf(position['y']) or
            math.isnan(position['z']) or math.isinf(position['z']) or
            math.isnan(direction['x']) or math.isinf(direction['x']) or
            math.isnan(direction['y']) or math.isinf(direction['y']) or
            math.isnan(direction['z']) or math.isinf(direction['z'])):
            raise Exception('bad position or direction')
        return {'pos':position,
                'dir':direction,
                'time':obj.time,
                'speed':obj.speed,
                'energy':obj.energy,
               }

    def parse_value(self,obj):
        return obj.value


if __name__ == '__main__':
    import sys
    import jsonUtil
    if len(sys.argv) < 2:
        raise Exception('need an I3 filename as an argument')
    ret = parseI3(sys.argv[1],nframes=10,start=0)

    print ret[0].keys()

    open('i3.json','w').write(jsonUtil.json_encode(ret))
