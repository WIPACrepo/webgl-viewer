// high energy starting events
hese = function(domain, element) {
    files = [];
    files.push({gcdfile : 'hese_results_IC79_GCD.i3',
                datafile : 'hese_results_IC79.i3',
                frametype : 'P',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
               });
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'hese_results_IC86.i3',
                frametype : 'P',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
               });
    var right_col = function(element,options,methods){
        var html = '<h4>Event Information:</h4>';
        var event = options.files[options.frames[options.frameno].fileno].dataret[options.frames[options.frameno].frameno];
        html += '<div class="prop dict">';
        html += '<div class="line"><div class="key">Event ID</div><div class="value">'+(options.frameno+1)+' / '+options.frames.length+'</div></div>';
        html += '<div class="line"><div class="key">Event Name</div><div class="value">'+event.Name+'</div></div>';
        html += '<div class="line"><div class="key">Energy</div><div class="value">'+event.energy+' TeV</div></div>';
        html += '<div class="line"><div class="key">Time</div><div class="value">'+event.time+' (Julian date)</div></div>';
        html += '<div class="line"><div class="key">Declination</div><div class="value">'+event.declination+' degrees</div></div>';
        html += '<div class="line"><div class="key">Right Ascension</div><div class="value">'+event.right_ascension+' degrees</div></div>';
        html += '<div class="line"><div class="key">Median Angular Error</div><div class="value">'+event.angular_error+' degrees</div></div>';
        html += '<div class="line"><div class="key">Event Type</div><div class="value">'+options.types[event.type]+'</div></div>';
        html += '</div>';
        html += '<div style="margin-top:2em"><button class="prev_frame">Previous Event</button><button class="next_frame" style="float:right">Next Event</button></div>';
        html += '<div class="fiducial" style="margin-top:1em">Highlight veto DOMs: <input type="checkbox" /></div>';
        $(element).html(html);
        
        if (options.show_fiducial)
            $(element).find('.fiducial input').prop('checked', true);
        $(element).find('.fiducial input').on('change',function(){
            methods.set_fiducial(this.checked);
            options.show_fiducial = this.checked;
        });

        $(element).find('.next_frame').on('click',function(){
            methods.next_frame();
            methods.draw_frame();
            methods.draw();
        });

        $(element).find('.prev_frame').on('click',function(){
            methods.prev_frame();
            methods.draw_frame();
            methods.draw();
        });
    };
    var html = '<h4 style="margin-bottom:0">Take a look at the 28 very high energy events found in data collected by the IceCube detector from May 2010 to May 2012. They constitute the first solid evidence for astrophysical neutrinos from cosmic accelerators.</h4>';
    html += '<h5 style="text-align:right;margin:0 0 .6em">You can rotate events to view from a different angle.</h5>';
    $(element).before(html);
    viewer_wrapper({domain:domain,
                    element:element,
                    randomize:false,
                    files:files,
                    pulse_choose:false,
                    preferred_pulseseries:['HLCPulses'],
                    bestfit_line:false,
                    smart_color:true,
                    types:{cascade:'cascade event',
                           muon:'track-like event'},
                    right_col_offset:310,
                    right_col_callback:right_col
    });
};

