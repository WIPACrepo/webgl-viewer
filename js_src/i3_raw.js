
// implement partial (curried) functions
var partial = function( f ) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        var remainingArgs = Array.prototype.slice.call(arguments);
        return f.apply(null, args.concat(remainingArgs));
    };
};

// some common functions
var raw_helpers = (function( ) {
    "use strict";
    
    /**
     *  Base64 / binary data / UTF-8 strings utilities
     *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
     **/
    var b64ToUint6 = function (nChr) {
      return nChr > 64 && nChr < 91 ?
          nChr - 65
        : nChr > 96 && nChr < 123 ?
          nChr - 71
        : nChr > 47 && nChr < 58 ?
          nChr + 4
        : nChr === 43 ?
          62
        : nChr === 47 ?
          63
        :
          0;
    };
    var base64DecToArr = function  (sBase64, nBlocksSize) {
      var
        sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);
      for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
          for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
            taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
          }
          nUint24 = 0;
        }
      }
      return taBytes;
    };
    
    var load_helpers = {
        header : function(buffer, type_name, class_register) {
            if (type_name in class_register) {
                if (class_register[type_name].tracking) {
                    //console.log('get object_id - 4 bytes');
                    load_helpers.uint32(buffer); // get object_id
                }
            } else {
                // get new object info
                //console.log('get new object info - 2 bytes');
                var tracking = load_helpers.uint8(buffer);
                var version = load_helpers.uint8(buffer);
                if (tracking) {
                    //console.log('get object_id - 4 bytes');
                    load_helpers.uint32(buffer); // get object_id
                }
                class_register[type_name] = {tracking:tracking,version:version};
            }
        },
        uint8 : function(buffer) {
            var ret = buffer.data.getUint8(buffer.index,true);
            buffer.index += 1;
            return ret;
        },
        uint16 : function(buffer) {
            var ret = buffer.data.getUint16(buffer.index,true);
            buffer.index += 2;
            return ret;
        },
        uint32 : function(buffer) {
            var ret = buffer.data.getUint32(buffer.index,true);
            buffer.index += 4;
            return ret;
        },
        String : function(buffer) {
            var size = load_helpers.uint32(buffer);
            var ret = '';
            for (var i=0;i<size;i++) {
                ret += String.fromCharCode(load_helpers.uint8(buffer));
            }
            return ret;
        }
    };
    
    // pad a hex string with 0s
    var zeroPad = function(num, numZeros) {
        var zeros = Math.max(0, numZeros - num.length );
        var zeroString = Math.pow(10,zeros).toString().substr(1);
        return zeroString+num;
    };
    
    return {
        decodeB64 : function(obj) {
            return base64DecToArr(obj).buffer;
        },
        readers : load_helpers,
        zeroPad : zeroPad
    };
})();


/**
 *  SuperDST i3 format to json recopulse dictionary
 **/
SuperDST = (function( ) {
    "use strict";
    
    // some constants
    var I3SUPERDSTCHARGESTAMP_STOP_BITMASK_V0 = 0x8000;
    var I3SUPERDSTCHARGESTAMP_HLC_BITMASK_V0 = 0x4000;
    var I3SUPERDSTCHARGESTAMP_TIME_BITS_V0 = 8;
    var I3SUPERDSTCHARGESTAMP_TIME_BITMASK_V0 = 0x00ff;
    var I3SUPERDSTCHARGESTAMP_CHARGE_BITS_V0 = 6;
    var I3SUPERDSTCHARGESTAMP_CHARGE_BITMASK_V0 = 0x3f00;
    var I3SUPERDSTCHARGESTAMP_CODE_BITMASK_V0 = 0x7fff;
    var I3SUPERDSTCHARGESTAMP_BYTESIZE_V0 = 2;
    var I3SUPERDST_DOMID_BITS_V0 = 13;
    var I3SUPERDST_DOMID_BITMASK_V0 = 0x1fff;
    var I3SUPERDST_SLOP_BITS_V0 = 3;
    var I3SUPERDST_SLOP_BITMASK_V0 = 0xe000;
    var I3SUPERDST_HEADER_BYTESIZE_V0 = 2;
    var I3SUPERDST_TMIN = -512.0;
    
    var class_register = {};
    
    var load_helpers = jQuery.extend(raw_helpers.readers,{
        SizeCodec : function(buffer) {
            load_helpers.header(buffer,'SizeCodec',class_register);
            var tag = load_helpers.uint8(buffer);
            ////console.log('SizeCodec - tag:'+raw_helpers.zeroPad(tag.toString(16),2));
            var size = 0;
            if (tag < 0xff-8) {
                size = tag;
            } else {
                var n_bytes = 0xff - tag;
                var bytes = null;
                for (var i=0;i<n_bytes;i++) {
                    bytes = load_helpers.uint8(buffer);
                    ////console.log('SizeCodec - i:'+i+' bytes:'+raw_helpers.zeroPad(bytes.toString(16),2));
                    size += bytes*Math.pow(2,i*8);
                }
                if (size >= Math.pow(2,53))
                    throw "SizeCodec is too big to properly represent in JS";
            }
            ////console.log('SizeCodec - size:'+size);
            return size;
        },
        DOMHeader : function(buffer) {
            var bytes = load_helpers.uint16(buffer);
            return {dom_id: (bytes & I3SUPERDST_DOMID_BITMASK_V0) ,
                    slop: (bytes & I3SUPERDST_SLOP_BITMASK_V0) >> I3SUPERDST_DOMID_BITS_V0
                   };
        },
        ChargeStamp : function(buffer) {
            var bytes = load_helpers.uint16(buffer);
            return {stamp: {rel_time: (bytes & I3SUPERDSTCHARGESTAMP_TIME_BITMASK_V0),
                            charge: (bytes & I3SUPERDSTCHARGESTAMP_CHARGE_BITMASK_V0) >> I3SUPERDSTCHARGESTAMP_TIME_BITS_V0,
                            hlc_bit: !!(bytes & I3SUPERDSTCHARGESTAMP_HLC_BITMASK_V0),
                            stop: !!(bytes & I3SUPERDSTCHARGESTAMP_STOP_BITMASK_V0)
                           },
                    overflow: {code: (bytes & I3SUPERDSTCHARGESTAMP_CODE_BITMASK_V0),
                               stop: !!(bytes & I3SUPERDSTCHARGESTAMP_STOP_BITMASK_V0)
                              },
                    raw: bytes
                   };
        },
        CompactVector : function(buffer,type) {
            load_helpers.header(buffer,type,class_register);
            var size = load_helpers.SizeCodec(buffer);
            var contents = [];
            for (var i=0;i<size;i++) {
                ////console.log('get another of type');
                contents.push(load_helpers[type](buffer));
            }
            return contents;
        }
    });
    
    var RunCodec = (function() {
        var funcs = {
            DecodeRun : function(codes, head, tail) {
                ////console.log('DecodeRun  head:'+head+' tail:'+tail)
                var runlength = 0, offset = 0;
                for(var i=head;i<tail;i++) {
                    runlength |= (((codes[i] & 0xf0) >> 4) & 0x0f) << offset;
                    offset += 4;
                }
                var ret = [];
                for(var i=0;i<runlength;i++) {
                    ret.push(codes[head]&0xf0);
                }
                return ret;
            },
            Decode : function(codes) {
                ////console.log('codes:'+JSON.stringify(codes))
                var runs = [];
                var head=0,tail=1;
                for (head=0;tail<codes.length;tail++) {
                    ////console.log('head:'+head+'  head code:'+(codes[head] & 0x0f))
                    ////console.log('tail:'+tail+'  tail code:'+(codes[tail] & 0x0f))
                    if ((codes[tail] & 0x0f) != (codes[head] & 0x0f)) {
                        var r = funcs.DecodeRun(codes, head, tail);
                        for (var i=0;i<r.length;i++) {
                            runs.push(r);
                        }
                        head = tail;
                    }
                }
                if (tail == codes.length) {
                    var r = funcs.DecodeRun(codes, head, tail);
                    for (var i=0;i<r.length;i++) {
                        runs.push(r);
                    }
                }
                return runs;
            }
        };
        return funcs;
    })();
    
    var DecodeOMKey = function(dom_id) {
        return {string: ((dom_id&0x1fc0) >> 6) & 0x007f,
                om: (dom_id&0x003f)+1
               };
    };
    
    var DecodeCharge = function(stamp) {
        var ret = 0.0;
        var chargecode = stamp.chargecode_ + stamp.charge_overflow_;
        var version = stamp.version_;
        var mode = stamp.charge_format_;
        var step = 9.0/0x3fff;
        if (stamp.mode == 'LOG') {
            ret = Math.pow(10.0, chargecode * step - 2.0);
        } else {
            if (version == 0)
                ret = chargecode * 0.15;
            else
                ret = chargecode * 0.05 + 0.025;
        }
        return ret;
    };
    
    var I3SuperDSTChargeStamp = function(timecode,chargecode,pulse_width,hlc,charge_format,version) {
        return {timecode_: timecode,
                chargecode_: chargecode,
                widthcode_: pulse_width,
                kind_: hlc,
                charge_format_: charge_format,
                charge_overflow_: 0,
                version_: version
               };
    };
    
    var load_v1 =  function(bits) {
        class_register = {};
        var buffer = {buf:raw_helpers.decodeB64(bits),
                      index:0};
        buffer.data = new DataView(buffer.buf);
        //console.log('buffer length: '+(new Uint8Array(buffer.buf)).length);
        
        // get basic header
        var header_padding = "";
        for (var i=0;i<12;i++) {
            header_padding += raw_helpers.zeroPad(load_helpers.uint8(buffer).toString(16),2);
        }
        //console.log("header padding: 0x"+header_padding);
        //console.log('read into buffer up to: '+buffer.index)
        
        // read from buffer
        var charge_stamps = load_helpers.CompactVector(buffer,'ChargeStamp');
        //console.log('read into buffer up to: '+buffer.index)
        var dom_headers = load_helpers.CompactVector(buffer,'DOMHeader');
        //console.log('read into buffer up to: '+buffer.index)
        var widths = [RunCodec.Decode(load_helpers.CompactVector(buffer,'uint8')), // InIce SLC
                      RunCodec.Decode(load_helpers.CompactVector(buffer,'uint8')), // InIce HLC
                      RunCodec.Decode(load_helpers.CompactVector(buffer,'uint8')), // IceTop SLC
                      RunCodec.Decode(load_helpers.CompactVector(buffer,'uint8'))  // IceTop HLC
                     ];
        var extra_bytes = load_helpers.CompactVector(buffer,'uint8');
        var extra_bytes_index = 0;
        //console.log('read into buffer up to: '+buffer.index);
        //console.log(charge_stamps.length+' charge stamps');
        //console.log(dom_headers.length+' dom headers');
        //console.log(widths[0].length+' widths 0');
        //console.log(widths[1].length+' widths 1');
        //console.log(widths[2].length+' widths 2');
        //console.log(widths[3].length+' widths 3');
        //console.log(extra_bytes.length+' extra bytes');
        
        var max_timecode_header = (1 << (I3SUPERDSTCHARGESTAMP_TIME_BITS_V0 + I3SUPERDST_SLOP_BITS_V0)) - 1;
        var max_timecode = (0x1 << I3SUPERDSTCHARGESTAMP_TIME_BITS_V0) - 1;
        var max_chargecode = (0x1 << I3SUPERDSTCHARGESTAMP_CHARGE_BITS_V0) - 1;
        //console.info('max_timecode_header:'+max_timecode_header);
        //console.info('max_timecode:'+max_timecode);
        //console.info('max_chargecode:'+max_chargecode);
        
        // interpret extracted data into readouts
        var readouts_ = [];
        var header = null, stamp = null, omKey = null;
        var stamp_index = 0;
        for (var i=0;i<dom_headers.length;i++) {
            header = dom_headers[i];
            if (stamp_index >= charge_stamps.length)
                throw "charge stamp out of range"
            stamp = charge_stamps[stamp_index];
            ////console.log('First stamp.raw: '+raw_helpers.zeroPad(stamp.raw.toString(16),4))
            if (isNaN(stamp.raw))
                throw 'stamp is NaN'
            
            var readout = {om_: {}, stamps_: [], kind_ : 'HLC', start_time_ : 0.0, time_overflow_ : 0.0};
            readout.om_ = DecodeOMKey(header.dom_id);
            var hlc = stamp.stamp.hlc_bit;
            var stop = stamp.stamp.stop;
            
            var pulse_widths = widths[(readout.om_.om > 60?2:0) + (hlc?1:0)];
            var pulse_widths_index = 0;
            
            var timecode = stamp.stamp.rel_time;
            var chargecode = stamp.stamp.charge;
            timecode |= (header.slop << I3SUPERDSTCHARGESTAMP_TIME_BITS_V0);
            var charge_format = (readout.om_.om > 60) ? 'log' : 'linear';
            
            if (timecode == max_timecode_header) {
                do {
                    stamp_index += 1;
                    stamp = charge_stamps[stamp_index];
                    ////console.log('maxtime stamp.raw: '+raw_helpers.zeroPad(stamp.raw.toString(16),4));
                    timecode += stamp.raw;
                } while (stamp.raw == 0xffff);
            }
            if (charge_format == 'linear' && chargecode == max_chargecode) {
                do {
                    stamp_index += 1;
                    stamp = charge_stamps[stamp_index];
                    ////console.log('maxcharge stamp.raw: '+raw_helpers.zeroPad(stamp.raw.toString(16),4));
                    chargecode += stamp.raw;
                } while (stamp.raw == 0xffff);
            } else if (charge_format == 'log') {
                if (extra_bytes_index >= extra_bytes.length)
                    throw "extra_bytes out of range"
                chargecode |= extra_bytes[extra_bytes_index] << I3SUPERDSTCHARGESTAMP_CHARGE_BITS_V0;
                extra_bytes_index += 1;
            }
            
            // get the first charge stamp
            if (pulse_widths_index >= pulse_widths.length)
                throw "pulse widths out of range"
            readout.stamps_.push(I3SuperDSTChargeStamp(timecode,chargecode,pulse_widths[pulse_widths_index],hlc,charge_format,1));
            pulse_widths_index += 1;
            
            // get remaining charge stamps
            while (!stop) {
                stamp_index += 1;
                if (stamp_index >= charge_stamps.length)
                    throw "charge stamp out of range"
                
                stamp = charge_stamps[stamp_index];
                ////console.log('stamp.raw: '+raw_helpers.zeroPad(stamp.raw.toString(16),4));
                if (isNaN(stamp.raw))
                    throw 'stamp is NaN'
                
                if (charge_format != 'linear')
                    throw "charge format must be linear for multiple stamps"
                if (stamp.stamp.hlc_bit != hlc) {
                    //console.log('HLC should be '+hlc+'  stamp_index:'+stamp_index+'  readout_index='+(readouts_.length-1));
                    ////console.log('OMKey('+readout.om_.string+','+readout.om_.om+')');
                    throw "hlc bit must be the same for multiple stamps"
                }
                
                timecode = stamp.stamp.rel_time;
                chargecode = stamp.stamp.charge;
                stop = stamp.stamp.stop;
                
                ////console.log('timecode='+timecode+'  max='+max_timecode+'  eq='+(timecode==max_timecode));
                
                if (timecode == max_timecode) {
                    do {
                        stamp_index += 1;
                        stamp = charge_stamps[stamp_index];
                        ////console.log('maxtime stamp.raw: '+raw_helpers.zeroPad(stamp.raw.toString(16),4));
                        timecode += stamp.raw;
                    } while (stamp.raw == 0xffff);
                }
                if (charge_format == 'linear' && chargecode == max_chargecode) {
                    do {
                        stamp_index += 1;
                        stamp = charge_stamps[stamp_index];
                        ////console.log('maxcharge stamp.raw: '+raw_helpers.zeroPad(stamp.raw.toString(16),4));
                        chargecode += stamp.raw;
                    } while (stamp.raw == 0xffff);
                }

                if (pulse_widths_index >= pulse_widths.length) {
                    ////console.log('pulse_widths_index:'+pulse_widths_index+'  length:'+ (pulse_widths.length)+'  readout_index='+(readouts_.length-1));
                    ////console.log('OMKey('+readout.om_.string+','+readout.om_.om+')');
                    throw "pulse widths out of range2"
                }
                readout.stamps_.push(I3SuperDSTChargeStamp(timecode,chargecode,pulse_widths[pulse_widths_index],hlc,'linear',1));
                pulse_widths_index += 1;
            }
            stamp_index += 1;
            
            readout.kind_ = hlc ? 'HLC' : 'SLC';
            
            readouts_.push(readout);
        }
        if (stamp_index != charge_stamps.length)
            throw "did not use all charge stamps"
        
        // Populate the start_time_ fields of the readouts_ for consistency
        var t_ref = 0.0;
        for (var i=0;i<readouts_.length;i++) {
            if (readouts_[i].stamps_.length <= 0)
                throw "missing stamps in a readout";
            t_ref += readouts_[i].stamps_[0].timecode_ + readouts_[i].time_overflow_;
            readouts_[i].start_time_ = t_ref;
        }
        
        return {readouts_:readouts_,
                masked_:null
               };
    };
    
    var public_methods = {
        Apply : function(obj,frame) {
            if (obj.masked_ != null)
                return obj.masked_;
            
            var recopulses = [];
            var recopulse_dups = {};
            var readout = null, t_ref=0.0, data={}, key=null;
            //console.log('num sdst readouts: '+(obj.readouts_.length));
            for (var i=0;i<obj.readouts_.length;i++) {
                readout = obj.readouts_[i];
                if (readout.om_.om <= 0) {
                    console.warn('readout has bad om'+(readout.om_.om));
                    continue;
                }
                data = [];
                t_ref = readout.start_time_;
                if (readout.stamps_.length > 0)
                    data.push({time:t_ref,
                               charge:DecodeCharge(readout.stamps_[0])
                              });
                else {
                    console.warn('readout has no length');
                    continue;
                }
                for (var j=1;j<readout.stamps_.length;j++) {
                    t_ref += readout.stamps_[j].timecode_;
                    data.push({time:t_ref,
                               charge:DecodeCharge(readout.stamps_[j])
                              });
                }
                key = readout.om_.string*1000+readout.om_.om;
                if (key in recopulse_dups) {
                    recopulses[recopulse_dups[key]].data = recopulses[recopulse_dups[key]].data.concat(data);
                } else {
                    recopulse_dups[readout.om_.string*1000+readout.om_.om] = recopulses.length;
                    recopulses.push({string:readout.om_.string,
                                     om:readout.om_.om,
                                     pmt:0,
                                     data:data
                                    });
                }
            }
            for (var i=0;i<recopulses.length;i++) {
                recopulses[i].data.sort(function(a,b){return a.time - b.time;});
            }
            recopulses.sort(function(a,b){
                if (a.string != b.string)
                    return a.string - b.string;
                else
                    return a.om - b.om;
            });
            //console.log('num recopulses:'+recopulses.length);
            //console.log(recopulses[0]);
            //console.log(recopulses[1]);
            //console.log(recopulses[2]);
            
            obj.masked_ = recopulses;
            return recopulses;
        }
    };
    
    return function(bits) {
        try {
            var obj = load_v1(bits);
        } catch (e) {
            throw e;
            throw "SuperDSTError ("+e+")";
        }
        var methods = {};
        for (var m in public_methods) {
            methods[m] = partial(public_methods[m],obj);
        }
        return methods;
    };
})();

/**
 *  RecoPulseSeriesMapMask i3 format to json recopulsemask dictionary
 **/
RecoPulseSeriesMapMask = (function( ) {
    "use strict";
    
    var class_register = {};
    
    var load_helpers = jQuery.extend(raw_helpers.readers,{
        bitmask : function(buffer) {
            var size = load_helpers.uint16(buffer);
            var padding = load_helpers.uint8(buffer);
            var mask = [];
            for (var i=0;i<size;i++) {
                mask.push(load_helpers.uint8(buffer));
            }
            return bitmask({size_:size,
                            padding_:padding,
                            mask_:mask
                           });
        },
        OMKeyMask : function(buffer) {
            load_helpers.header(buffer,'OMKeyMask',class_register);
            return load_helpers.bitmask(buffer);
        },
        ElementMasks : function(buffer) {
            load_helpers.header(buffer,'ElementMasks',class_register);
            var masks = [];
            var count = load_helpers.uint32(buffer);
            for (var i=0;i<count;i++) {
                masks.push(load_helpers.bitmask(buffer));
            }
            return masks;
        }
    });
    
    var bitmask = (function(){
        var funcs = {
            size : function(obj) {
                return 8*obj.size_ - obj.padding_;
            },
            get : function(obj,i) {
                if (i < 0 || i >= (8*obj.size_ - obj.padding_))
                    throw new Error('index out of range')
                try {
                    return obj.mask_[Math.floor(i/8)]&(1<<(i%8));
                } catch (e) {
                    //console.log(obj);
                    throw e;
                }
            },
            any : function(obj) {
                var test = 0;
                for (var i=0;i<obj.size_;i++)
                    test |= obj.mask_[i];
                return (test != 0);
            },
            all : function(obj) {
                var test = true;
                var max_i = (obj.size_ == 0) ? 0 : obj.size_ - 1;
                for (var i=0;i<max_i;i++)
                    test = test && (obj.mask_[i] == 0xff);
                return (test && (obj.mask_[max_i] == (0xff >> obj.padding_)));
            },
            sum : function(obj) {
                var s = 0;
                for (var i=0;i<obj.size_;i++)
                    for (var j=0;j<8;j++)
                        if (obj.mask_[i]&(1<<j))
                            s++;
                return s;
            }
        }
        return function(obj){
            var methods = {};
            methods.length = (8*obj.size_ - obj.padding_);
            for (var m in funcs) {
                methods[m] = partial(funcs[m],obj);
            }
            return methods;
        };
    })();
    
    var load = function(bits) {
        class_register = {};
        var buffer = {buf:raw_helpers.decodeB64(bits),
                      index:0};
        buffer.data = new DataView(buffer.buf);
        //console.log('buffer length: '+(new Uint8Array(buffer.buf)).length);
        
        // get basic header
        var header_padding = "";
        for (var i=0;i<12;i++) {
            header_padding += raw_helpers.zeroPad(load_helpers.uint8(buffer).toString(16),2);
        }
        var version = header_padding[4];
        //console.log("header padding: 0x"+header_padding);
        //console.log('read into buffer up to: '+buffer.index)
        
        // read from buffer
        var key = load_helpers.String(buffer);
        //console.log('key='+key);
        
        if (version == 1)
            var timereference = load_helpers.float(buffer); // ***** TODO *****
        
        var omkey_mask_ = load_helpers.OMKeyMask(buffer);
        var element_masks_ = load_helpers.ElementMasks(buffer);
        
        if (version == 0 && element_masks_.length == 0 && omkey_mask_.length == 64 && omkey_mask_.all())
            omkey_mask_ = bitmask({size_:0,
                                   padding_:8,
                                   mask_:[0]
                                  });
        
        return {key_:key,
                omkey_mask_:omkey_mask_,
                element_masks_:element_masks_,
                masked_:null
               };
    };
    
    var public_methods = {
        Apply : function(obj, frame) {
            if (obj.masked_ != null)
                return obj.masked_;
            
            if (!(obj.key_ in frame))
                throw new Error('key '+(obj.key_)+' not in frame');
            
            var source = frame[obj.key_];
            if ('Apply' in source)
                source = source.Apply(frame);
            source.sort(function(a,b){
                if (a.string != b.string)
                    return a.string - b.string;
                else
                    return a.om - b.om;
            });
            //console.log(source[0].string+' '+source[0].om);
            //console.log(source[1].string+' '+source[1].om);
            //console.log(source[2].string+' '+source[2].om);
            //console.log('omkey_mask_.length = '+obj.omkey_mask_.length);
            //console.log('element_masks_.length = '+obj.element_masks_.length);
            
            obj.masked_ = [];
            var source_it=0, masked_it=0, list_it=0;
            for (;source_it < source.length;source_it++) {
                //console.log('source #'+source_it);
                if (!obj.omkey_mask_.get(source_it)) {
                    //console.log('skipping omkey_mask_');
                    continue;
                } else if (obj.element_masks_[list_it].sum() == 0) {
                    //console.log('skipping element_mask_');
                    list_it++;
                    continue;
                }
                //console.log('now on OM('+(source[source_it].string)+','+(source[source_it].om)+'), source #'+source_it+', element #'+list_it);
                
                var idx = 0;
                var target_vec = [];
                var source_vec_it = 0;
                if (source[source_it].data.length != obj.element_masks_[list_it].length)
                    throw new Error('The mask for OM('+(source[source_it].string)+','+(source[source_it].om)+') has '+(obj.element_masks_[list_it].length)+' entries, but source has '+(source[source_it].data.length)+' entries');
                
                for (;source_vec_it != source[source_it].data.length;source_vec_it++,idx++) {
                    if (obj.element_masks_[list_it].get(idx))
                        target_vec.push(source[source_it].data[source_vec_it]);
                }
                list_it++;
                obj.masked_.push({string:source[source_it].string,
                                  om:source[source_it].om,
                                  pmt:source[source_it].pmt,
                                  data:target_vec
                                 });
            }
            return obj.masked_;
        },
        GetSource : function(obj) {
            return obj.key_;
        }
    };
    
    return function(bits) {
        try {
            var obj = load(bits);
        } catch (e) {
            throw e;
            throw new Error("RecoPulseSeriesMapMask Error ("+e+")");
        }
        var methods = {};
        for (var m in public_methods) {
            methods[m] = partial(public_methods[m],obj);
        }
        return methods;
    };
})();

/**
 *  RecoPulseSeriesMapUnion i3 format to json recopulsemask dictionary
 **/
RecoPulseSeriesMapUnion = (function( ) {
    "use strict";
    
    var class_register = {};
    
    var load_helpers = jQuery.extend(raw_helpers.readers,{
        StringVector : function(buffer) {
            load_helpers.header(buffer,'StringVector',class_register);
            var keys = [];
            var count = load_helpers.uint32(buffer);
            for (var i=0;i<count;i++) {
                keys.push(load_helpers.String(buffer));
            }
            return keys;
        }
    });
    
    var load = function(bits) {
        class_register = {};
        var buffer = {buf:raw_helpers.decodeB64(bits),
                      index:0};
        buffer.data = new DataView(buffer.buf);
        //console.log('buffer length: '+(new Uint8Array(buffer.buf)).length);
        
        // get basic header
        var header_padding = "";
        for (var i=0;i<12;i++) {
            header_padding += raw_helpers.zeroPad(load_helpers.uint8(buffer).toString(16),2);
        }
        var version = header_padding[4];
        //console.log("header padding: 0x"+header_padding);
        //console.log('read into buffer up to: '+buffer.index)
        
        // read from buffer
        var keys = load_helpers.StringVector(buffer);
        //console.log('keys='+keys);
        
        return {keys_:keys,
                unified_:null
               };
    };
    
    var public_methods = {
        Apply : function(obj, frame) {
            if (obj.unified_ != null)
                return obj.unified_;
            
            var omkey = function(pulse){
                return (pulse.string)+','+(pulse.om)+','+(pulse.pmt);
            };
            
            obj.unified_ = [];
            for (var s=0;s<obj.keys_.length;s++) {
                if (!(obj.keys_[s] in frame))
                    throw new Error('key '+(obj.keys_[s])+' not in frame');
                
                var source = frame[obj.keys_[s]];
                if ('Apply' in source)
                    source = source.Apply(frame);
                source.sort(function(a,b){
                    if (a.string != b.string)
                        return a.string - b.string;
                    else
                        return a.om - b.om;
                });
                //console.log(source[0].string+' '+source[0].om);
                //console.log(source[1].string+' '+source[1].om);
                //console.log(source[2].string+' '+source[2].om);
                
                var mapper = {};
                var source_it=0,key='',dest=null;
                for (;source_it < source.length;source_it++) {
                    key = omkey(source[source_it]);
                    if (key in mapper) {
                        dest = obj.unified_[mapper[key]]
                        for (var i=0;i<source[source_it].data.length;i++) {
                            dest.data.push(source[source_it].data[i]);
                        }
                    } else {
                        mapper[key] = obj.unified_.length;
                        obj.unified_.push(source[source_it]);
                    }
                }
            }
            
            for (var i=0;i<obj.unified_.length;i++) {
                obj.unified_[i].data.sort(function(a,b){
                    return a.time - b.time;
                });
            }
            
            obj.unified_.sort(function(a,b){
                if (a.string != b.string)
                    return a.string - b.string;
                else
                    return a.om - b.om;
            });
            
            return obj.unified_;
        },
        GetSources : function(obj) {
            return obj.keys_;
        }
    };
    
    return function(bits) {
        try {
            var obj = load(bits);
        } catch (e) {
            throw e;
            throw new Error("RecoPulseSeriesMapUnion Error ("+e+")");
        }
        var methods = {};
        for (var m in public_methods) {
            methods[m] = partial(public_methods[m],obj);
        }
        return methods;
    };
})();
