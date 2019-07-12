//speed of light quiz

var csv_data = "";
var csv_callback = function() {
    var blob = new Blob([csv_data], {type: "text/csv;charset=utf-8"});
    saveAs(blob, "recopulses.csv");
};
speed_of_light = function(domain, element) {
    var quiz_length = 12;
    var last_dom_display = false;
    var coord_display = false;
    var linefit_display = false;

    files = [];
    files.push({gcdfile : 'IC86_GCD.i3',
                datafile : 'speed_of_light.i3.gz',
                frametype : 'P',
                eventtype : 'down',
                datakeys : ['SRTOfflinePulses','MaskedOfflinePulses','OfflinePulses','time','energy','LineFit','MPEFit','SPEFit']
               });
    files.push({gcdfile : 'hese_results_IC79_GCD.i3',
                datafile : 'hese_results_IC79.i3',
                frametype : 'P',
                eventtype : 'down',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','time','energy','LineFit','MPEFit','SPEFit'],
                eventids : [4]
               });
    var last_dom_html = '', csv_html = '', linefit_html = '';
    var coord_html = '<div><span style="color:#0000CC">Blue</span> is X</div><div><span style="color:#00CC00">Green</span> is Y</div><div><span style="color:#CC0000">Red</span> is Z</div>';
    var right_col = function(element,options,methods){
        var frame = {};
        try {
            var fileno = options.frames[options.frameno].fileno;
            var frameno = options.frames[options.frameno].frameno;
            frame = options.files[fileno].dataret[frameno];
        } catch (e) {
            console.log(e);
        }
        console.log(frame);
        var html = '<h4 style="margin-bottom:6px">This event was detected in the IceCube Neutrino Observatory.</h4>';
        html += '<p><span style="font-weight:bold">Date:</span> '+MJD_to_month_string(frame['time'])+'</p>';
        html += '<p><span style="font-weight:bold">Energy:</span> '+frame['energy'];
        if ((''+frame['energy']).indexOf('GeV') < 0 && (''+frame['energy']).indexOf('TeV') < 0)
            html += ' TeV';
        html += '</p>';
        html += '<p><span style="font-weight:bold">Event id:</span> '+options.frameno+'</p>';
        html += '<div id="last_dom" style="margin:1.5em 0">'+last_dom_html+'</div>';
        html += '<div class="last_dom_enable" style="margin: 1.5em 0"><input type="checkbox" ';
        if (last_dom_display == true)
            html += 'checked ';
        html += ' /> Enable full last dom info</div>';
        html += '<div class="coord_enable" style="margin: 1.5em 0"><input type="checkbox" ';
        if (coord_display == true)
            html += 'checked ';
        html += ' /> Enable coordinate info</div>';
        html += '<div class="coord" style="margin: -1em 0px 0px 1.6em';
        if (coord_display != true)
            html += ';display:none';
        html += '">' + coord_html;
        html += '</div>';
        html += '<div class="linefit_enable" style="margin: 1.5em 0"><input type="checkbox" ';
        if (linefit_display == true)
            html += 'checked ';
        html += ' /> Enable linefit</div>';
        html += '<div class="linefit" style="margin: -1em 0px 0px 1.6em';
        if (linefit_display != true)
            html += ';display:none';
        html += '">' + linefit_html;
        html += '</div>';
        html += '<div id="csv" style="margin:1.5em 0">'+csv_html+'</div>';
        //html += '<div><button class="next_frame" style="margin-top:7px">Next Event</button></div>';
        $(element).html(html);

        $(element).find('.next_frame').on('click',function(){
            methods.next_frame();
            methods.draw_frame();
            methods.draw();
        });
        $(element).find('.last_dom_enable input').on('change',function(){
            console.log('last_dom_enable');
            if (last_dom_display == true) {
                last_dom_display = false;
                $(element).find('.position').css( "display", "none" );
            } else {
                last_dom_display = true;
                $(element).find('.position').css( "display", "inline-block" );
            }
            methods.draw_frame();
            methods.draw();
        });
        $(element).find('.coord_enable input').on('change',function(){
            console.log('coord_enable');
            if (coord_display == true) {
                coord_display = false;
                $(element).find('.coord').css( "display", "none" );
            } else {
                coord_display = true;
                $(element).find('.coord').css( "display", "block" );
            }
            methods.draw_frame();
            methods.draw();
        });
        $(element).find('.linefit_enable input').on('change',function(){
            console.log('linefit_enable');
            if (linefit_display == true) {
                linefit_display = false;
                $(element).find('.linefit').css( "display", "none" );
            } else {
                linefit_display = true;
                $(element).find('.linefit').css( "display", "block" );
            }
            methods.draw_frame();
            methods.draw();
        });
    };
    var last_dom_handler = function(x,y,z,time) {
        last_dom_html = '<p style="font-weight:bold;padding:0;margin:.5em 0">Last Hit Dom</p><p style="padding:0;margin:.5em 0">Time: '+time.toFixed()+' ns</p>';
        last_dom_html += '<div class="position"';
        if (last_dom_display == false)
            last_dom_html += ' style="display:none"';
        last_dom_html += '><div class="dict">Position:';
        last_dom_html += '<div class="line indent"><div class="key">x:</div><div class="value right" style="width:6.5em">'+x.toFixed(3)+' m</div></div>';
        last_dom_html += '<div class="line indent"><div class="key">y:</div><div class="value right" style="width:6.5em">'+y.toFixed(3)+' m</div></div>';
        last_dom_html += '<div class="line indent"><div class="key">z:</div><div class="value right" style="width:6.5em">'+z.toFixed(3)+' m</div></div>';
        last_dom_html += '</div></div>';
        var e = $(element).find('#last_dom');
        if ($(e).length > 0)
            $(e).html(last_dom_html);
        return last_dom_display;
    }
    var csv_handler = function(csv,cb) {
        csv_data = csv;
        csv_html = '<button onclick="csv_callback()">Download CSV of Pulses</button>';
        var e = $(element).find('#csv');
        if ($(e).length > 0)
            $(e).html(csv_html);
    }
    var coord_handler = function() {
        return coord_display;
    }
    var linefit_handler = function(p) {
        linefit_html = '<div style="margin-left:1.6em">';
        linefit_html += '<div class="dict">Position:';
        linefit_html += '<div class="line indent"><div class="key">x:</div><div class="value right" style="width:6.5em">'+p.pos.x.toFixed(3)+'</div></div>';
        linefit_html += '<div class="line indent"><div class="key">y:</div><div class="value right" style="width:6.5em">'+p.pos.y.toFixed(3)+'</div></div>';
        linefit_html += '<div class="line indent"><div class="key">z:</div><div class="value right" style="width:6.5em">'+p.pos.z.toFixed(3)+'</div></div>';
        linefit_html += '</div>';
        linefit_html += '<div class="dict">Direction:';
        linefit_html += '<div class="line indent"><div class="key">x:</div><div class="value right" style="width:6.5em">'+p.dir.x.toFixed(3)+'</div></div>';
        linefit_html += '<div class="line indent"><div class="key">y:</div><div class="value right" style="width:6.5em">'+p.dir.y.toFixed(3)+'</div></div>';
        linefit_html += '<div class="line indent"><div class="key">z:</div><div class="value right" style="width:6.5em">'+p.dir.z.toFixed(3)+'</div></div>';
        linefit_html += '</div></div>';
        var e = $(element).find('.linefit');
        if ($(e).length > 0)
            $(e).html(linefit_html);
        return linefit_display;
    }
    var html = '<h4>This is an interactive display, you can rotate the view and zoom in and out.</h4>';
    //html += '<h5 style="text-align:right;margin: 3px 0">You can rotate events to view from a different angle.</h5>';
    $(element).before(html);
    viewer_wrapper({domain:domain,
            element:element,
            files:files,
            active_artists:{'last_dom':{'handler':last_dom_handler},
                            'recopulse_csv':{'handler':csv_handler},
                            'coordinates':{'handler':coord_handler},
                            'linefit':{'handler':linefit_handler}
                           },
            randomize:false,
            pulse_choose:false,
            preferred_pulseseries:['SRTOfflinePulses','HLCPulses','OfflinePulses'],
            smart_color:true,
            bestfit_line:false,
            right_col_offset:310,
            right_col_callback:right_col,
            loaded:right_col,
            types:{up:'Upgoing track',
                   down:'Downgoing track'
            },
            type_explanation:{
                up:'Upgoing tracks are caused by neutrinos that travel through the Earth and interact with the detector.',
                down:'Downgoing tracks are usually the product of muons coming from cosmic rays that interact with the Earth&rsquo;s atmosphere.',
                cascade:'Cascades occur when an electron neutrino causes a particle shower.',
                coincident:'When two or more particles interact inside the detector at one time, it is know as a coincident event.  They are often caused by downgoing cosmic ray muons.'
            },
            asked:0,
            correct:0
    });
};

