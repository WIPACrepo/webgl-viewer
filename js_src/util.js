// utilities

// implement partial (curried) functions
partial = function( f ) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        var remainingArgs = Array.prototype.slice.call(arguments);
        return f.apply(null, args.concat(remainingArgs));
    };
};

logging = (function( ){
    var states = {
        error : [10,'ERROR'],
        warn : [20,'WARNING'],
        info : [30,'INFO'],
        debug : [40,'DEBUG']
    };
    var special_output = {
        error : console.error,
        warn : console.warn,
        info : console.info,
        debug : console.log
    };
    var logger = function(min_level,state,message) {
        if (state in states && states[state][0] <= min_level) {
            try {
                special_output[state](message);
            } catch ( e ) {
                console.log(states[state][1]+': '+message);
            }
        }
    };
    return function(min_level) {
        if (min_level == undefined || !(min_level in states))
            min_level = states.info[0];
        else
            min_level = states[min_level][0];
        return {
            error : partial(logger,min_level,'error'),
            warn : partial(logger,min_level,'warn'),
            info : partial(logger,min_level,'info'),
            debug : partial(logger,min_level,'debug')
        };
    };
})();
var logger = logging('warn');


rand_int = function(lower,upper){
    // a random integer [lower,upper]
    if (lower === null || lower === undefined) {
        lower = 0;
    } else {
        lower = lower + 0;
    }
    if (upper === null || upper === undefined) {
        upper = 4294967296; // 2^32
    } else {
        upper = upper + 1;
    }
    upper = upper - lower;
    return Math.floor(Math.random()*upper)+lower;
};

isInt = function( val ) {
    return /^[\-0-9]+$/.test(val);
};

average = function(a) {
    var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
    for(var m, s = 0, l = t; l--; s += a[l]);
        for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
    return r.deviation = Math.sqrt(r.variance = s / t), r;
};

mode = function(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
};

decimalToHex = function( d ) {
    var hex = Number(d).toString(16).toUpperCase();
    hex = "#000000".substr(0, 7 - hex.length) + hex;
    return hex;
};

decimalToRGBA = function( d, a ) {
    return 'rgba(' + ( (d&0xff0000)>>>16 )  + ',' + ( ( (d&0x00ff00)>>>8 ) | 0 ) + ',' + ( ( d&0x0000ff ) | 0 ) + ',' + ( a ) + ')';
};

convertToAssociative = function( arr ) {
    var len = arr.length;
    var newarr = {};
    for (var i=0;i<len;i++) {
        if (arr[i] != undefined) { newarr[arr[i]] = arr[i]; }
    }
    return newarr;
};

isAssociativeEmpty = function(obj) {
    var name;
    for (name in obj) {
        if (obj.hasOwnProperty(name)) {
            return false;
        }
    }
    return true;
};

associativeLength = function(obj) {
    var cnt = 0;
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key))
            cnt++;
    }
    return cnt;
};

popAssociative = function(obj) {
  for (var key in obj) {
    if (!Object.hasOwnProperty.call(obj, key)) continue;
    var result = [key,obj[key]];
    if (!delete obj[key]) { throw new Error(); }
    return result;
  }
}


MJD_to_date = function(input) {
    var d = new Date();
    d.setTime((input - 40587)*86400000);
    return d;
}
MJD_to_date_string = function(input) {
    var d = MJD_to_date(input);
    return d.getUTCFullYear()+'/'+(d.getUTCMonth()+1)+'/'+d.getUTCDate();
}
MJD_to_month_string = function(input) {
    var d = MJD_to_date(input);
    return d.getUTCFullYear()+'/'+(d.getUTCMonth()+1);
}

// a shuffling function
function fisher_yates ( myArray ) {
  var i = myArray.length, j, tempi, tempj;
  if ( i == 0 ) return false;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     tempi = myArray[i];
     tempj = myArray[j];
     myArray[i] = tempj;
     myArray[j] = tempi;
   }
}

file_loader = (function( $ ){
    var private_methods = {
        download_file : function(state) {
            // download the next file, if possible
            if (!isAssociativeEmpty(state.waiting)) {
                var file = popAssociative(state.waiting);
                var file_key = file[0];
                var file_obj = file[1];
                // skip duplicates
                if (file_key in state.in_progress ||
                    file_key in state.succeeded_files ||
                    file_key in state.failed_files) {
                    return private_methods.download_file(state);
                }
                state.in_progress[file_key] = true;
                log.info('in_progress: '+JSON.stringify(state.in_progress));
                state.downloader(file_obj,partial(private_methods.success_callback,state,file_key),
                                      partial(private_methods.error_callback,state,file_key));
            }
        },
        success_callback : function(state,file_key,ret) {
            if (ret === undefined) {
                state.failed_files[file_key] = false;
            } else {
                state.succeeded_files[file_key] = ret;
            }
            delete state.in_progress[file_key];
            log.info('in_progress: '+JSON.stringify(state.in_progress));
            if (!isAssociativeEmpty(state.waiting)) {
                if (state.running) {
                    private_methods.download_file(state);
                }
            } else if (isAssociativeEmpty(state.in_progress)) {
                log.info('done with downloads');
                state.callback(state.succeeded_files,
                                    state.failed_files)
            } else {
                log.info('done, but not all finished');
            }
        },
        error_callback : function(state,file_key,ret) {
            state.failed_files[file_key] = ret;
            delete state.in_progress[file_key];
            log.info('in_progress: '+JSON.stringify(state.in_progress));
            if (!isAssociativeEmpty(state.waiting)) {
                if (state.running) {
                    private_methods.download_file(state);
                }
            } else if (isAssociativeEmpty(state.in_progress)) {
                log.info('done with downloads');
                state.callback(state.succeeded_files,
                                    state.failed_files)
            } else {
                log.info('done, but not all finished');
            }
        }
    };

    var public_methods = {
        start : function(state) {
            log.info(state);
            state.running = true;
            for (var i=0;i<state.parallel;i++) {
                private_methods.download_file(state);
            }
        },
        stop : function(state) {
            state.running = false;
        }
    };

    function init(options) {
        options = $.extend({
            waiting : {},
            in_progress : {},
            succeeded_files : {},
            failed_files : {},
            parallel : 4,
            running : false,
            downloader : function(f,success,failure){ c(false); },
            callback : function(s,f){ return; }
        },options);
        return options;
    }

    return function( options ){
        var state = init(options);
        return function( method ) {
            if ( public_methods[method] ) {
                return public_methods[method].apply( this, [state].concat(Array.prototype.slice.call( arguments, 1 )));
            } else {
                $.error( 'Method ' +  method + ' does not exist on file_loader' );
            }
        };
    };
})(jQuery);

load_css = (function( $ ) {
    return function(url, callback, nocache){
        if (typeof nocache=='undefined') nocache=false; // default don't refresh
        if (nocache) url += '?_ts=' + new Date().getTime();
        $('<link>', {rel:'stylesheet', type:'text/css', 'href':url}).on('load', function(){
            if (typeof callback=='function') callback();
        }).appendTo('head');
    };
})(jQuery);

var popup = (function( $ ){
    var state = null;

    var privateMethods = {
        ok : function( ) {
            var options = $(this).data('options');
            if (options.ok != null) {
                if (options.innerhtml != null) {
                    options.ok();
                } else {
                    options.ok($(this).find('input[type=text]').val());
                }
            }
            $(this).fadeOut(function(){$(this).remove();});
            state = null;
            return false;
        },
        cancel : function( ) {
            var options = $(this).data('options');
            if (options.cancel != null) {
                if (options.innerhtml != null) {
                    options.cancel();
                } else {
                    options.cancel($(this).find('input[type=text]').val());
                }
            }
            $(this).fadeOut(function(){$(this).remove();});
            state = null;
            return false;
        },
    };

    var publicMethods = {
        ok : function ( fun ) {
            // set ok event handler
            var options = $(this).data('options');
            if (fun != undefined && fun != null) {
                options.ok = fun;
            } else {
                options.ok = null;
            }
        },
        cancel : function ( fun ) {
            // set cancel event handler
            var options = $(this).data('options');
            if (fun != undefined && fun != null) {
                options.cancel = fun;
            } else {
                options.cancel = null;
            }
        },
        getObj : function ( ) {
            return $(this).find('div.inner');
        }
    };

    var init = function( options ) {
        options = $.extend({
            ok : null,
            cancel : null,
            title : 'Edit:',
            button : 'Save',
            value : '',
            innerhtml : null,
            height : null,
            width : null,
        },options);


        if (state != null) {
            $('.popup').fadeOut(function(){$(this).remove();});
            state = null;
        }

        $('body').append('<div class="popup"></div><div class="popup_inner"></div>');
        var outerpopup = $('div.popup').filter(':last');
        $(outerpopup).data('options',options);
        var popup = $('div.popup_inner').filter(':last');

        var marginheight = null;
        var marginwidth = null;
        if (options.height != null) {
            if (options.height == 'auto') {
                marginheight = 10;
            } else {
                marginheight = parseFloat(options.height.slice(0,-2),10)/2;
            }
            $(popup).css('height',options.height);
        }
        if (options.width != null) {
            if (options.width != 'auto') {
                marginwidth = parseFloat(options.width.slice(0,-2),10)/2;
            }
            $(popup).css('width',options.width);
        }
        if (marginwidth != null || marginheight != null) {
            if (marginwidth == null) { marginwidth = 12.5; }
            if (marginheight == null) { marginheight = 3.5; }
            $(popup).css('margin','-'+marginheight+'em 0 0 -'+marginwidth+'em');
        }

        if (options.innerhtml != null) {
            $(popup).append('<h2>'+options.title+'</h2>'+options.innerhtml+'<button>'+options.button+'</button>');
        } else {
            $(popup).append('<h2>'+options.title+'</h2><input type="text" /><button>'+options.button+'</button>');
            var input = $(popup).find('input[type=text]');
            input.val(options.value);
            $(input).css('margin-right','.5em');
        }
        var button = $(popup).find('button');

        $(popup).on('keydown','input',function(e){
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) {
                $(button).trigger('click');
                return false;
            }
        });

        $(button).on('click',function(){
            privateMethods.ok.apply(outerpopup);
            $(popup).remove();
        });
        $(popup).on('click',function(){return false;});
        $(outerpopup).on('click',function(){
            privateMethods.cancel.apply(outerpopup);
            $(popup).remove();
        });

        $(popup).show();
        state = true;

        return $(outerpopup);
    };

    return function( options ){
        var obj = init(options);

        return function( method ) {
            if ( publicMethods[method] ) {
                return publicMethods[method].apply( obj, Array.prototype.slice.call( arguments, 1 ));
            } else {
                $.error( 'Method ' +  method + ' does not exist on popup' );
            }
        };
    };
})( jQuery );

bytearray = (function( ) {
    var public_methods = {
        isset : function(bits,i) {
            if (Math.ceil(i/8) > bits.length)
                return false;
            else
                return !!(bits[Math.floor(i/8)].charCodeAt(0)&(1<<(i%8)));
        },
        sum : function(bits) {
            var s = 0;
            for (var i=0;i<bits.length;i++)
                for (var j=0;j<8;j++)
                    if (bits[i].charCodeAt(0)&(1<<j))
                        s++;
            return s;
        }
    };
    return function(bits) {
        var methods = {
            length : bits.length*8,
        };
        for (var m in public_methods) {
            methods[m] = partial(public_methods[m],bits);
        }
        return methods;
    };
})();

json_decode_helper = (function( $ ){

    /**
    *  Base64 encode / decode
    *  http://www.webtoolkit.info/
    **/
    var Base64 = {
        // private property
        _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        // public method for encoding
        encode : function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = Base64._utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
            }
            return output;
        },

        // public method for decoding
        decode : function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = Base64._utf8_decode(output);
            return output;
        },

        // private method for UTF-8 encoding
        _utf8_encode : function (string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        },

        // private method for UTF-8 decoding
        _utf8_decode : function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            while ( i < utftext.length ) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i+1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i+1);
                    c3 = utftext.charCodeAt(i+2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    };

    var base64decode = function(obj) {
        try {
            return window.atob(obj);
        } catch ( e ) {
            try {
                return Base64.decode(obj);
            } catch ( e ) {
                logger.warn('failed base64 decoding');
                return obj;
            }
        }
    };
    var JSONConverters = {
        'binary':function(obj){
            logger.debug('binary');
            return base64decode(obj);
        },
        'SuperDST':function(obj){
            logger.debug('SuperDST');
            return SuperDST(obj);
        },
        'RecoPulseSeriesMapMask':function(obj){
            logger.debug('RecoPulseSeriesMapMask');
            return RecoPulseSeriesMapMask(obj);
        },
        'RecoPulseSeriesMapUnion':function(obj){
            logger.debug('RecoPulseSeriesMapUnion');
            return RecoPulseSeriesMapUnion(obj);
        },
        'bytearray':function(obj){
            logger.debug('bytearray');
            return bytearray(base64decode(obj));
        },
        'bytearray_list':function(obj){
            logger.debug('bytearray_list');
            var ret = [];
            for (var i=0;i<obj.length;i++) {
                ret.push(bytearray(base64decode(obj[i])));
            }
            return ret;
        }
    };
    return function process(input) {
        var ret = {};
        if ('__jsonclass__' in input) {
            // this is special, so let's handle it
            ret = JSONConverters[input['__jsonclass__'][0]](input['__jsonclass__'][1]);
        } else {
            // recurse through objects
            for (var k in input) {
                if (!Object.hasOwnProperty.call(input, k)) continue;
                var val = input[k];
                var type = $.type(val);
                if (type == 'object')
                    val = process(val);
                else if (type == 'array') {
                    var newval = [];
                    for (var i=0;i<val.length;i++) {
                        newval.push(process(val[i]));
                    }
                    val = newval;
                }
                ret[k] = val;
            }
        }
        return ret;
    };
})(jQuery);