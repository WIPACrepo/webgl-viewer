// background vs signal test
background_signal = function(domain, element) {
    var number_of_events = 2*10;
    files = [];
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'signal_ic86_1.i3.gz',
                frametype : 'P',
                datakeys : ['SplitOfflinePulsesHLC','HLCPulses','SplitOfflinePulses','OfflinePulses','Qtot','CausalQTot','VHESelfVeto','VHESelfVetoVertexTime']
               });
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'signal_ic86_2.i3.gz',
                frametype : 'P',
                datakeys : ['HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','Qtot','CausalQTot','VHESelfVeto','VHESelfVetoVertexTime']
               });
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'unweighted_sim.i3.gz',
                frametype : 'P',
                datakeys : ['SplitOfflinePulsesHLC','SplitOfflinePulses','OfflinePulsesHLC','MaskedOfflinePulses','OfflinePulses','Qtot','CausalQTot','VHESelfVeto','VHESelfVetoVertexTime']
               });
    var loaded = function(options,methods){
        console.log('loaded');
        var html = '<div style="margin-bottom:20px"><h2 style="margin: 5px 0">Simulation Challenge: Background or Signal?</h2>';
        html += '<h4 style="margin: 3px 0 8px">Can you guess whether the signal (astrophysical neutrinos) is on the left or the right?</h4>';
        html += '<h5 style="float:right; margin: 3px 0">You can rotate events to view from a different angle.</h5>';
        html += '<button class="answers">Reveal Signal</button></div>';
        var signal_left = Math.random() >= 0.5;
        if (signal_left) {
            html += '<div class="signal" style="float:left"></div><div class="background" style="float:right"></div>';
        } else {
            html += '<div class="background" style="float:left"></div><div class="signal" style="float:right"></div>';
        }
        $(element).prepend(html);
        var n = 0;
        var events_used = [{},{}];
        (function load_next_event(end_callback){
            if (n >= number_of_events)
                return;
            var signal = (signal_left && n%2 == 0) || (!signal_left && n%2 == 1);
            if (signal) {
                var nframes = options.files[0].dataret.length+options.files[1].dataret.length-1;
                var nevent = rand_int(0,nframes);
                while(nevent in events_used[0]) { nevent = rand_int(0,nframes); }
                if (nevent >= options.files[0].dataret.length)
                    var event = options.files[1].dataret[nevent-options.files[0].dataret.length];
                else
                    var event = options.files[0].dataret[nevent];
                events_used[0][nevent] = true;
            } else {
                var nevent = rand_int(0,options.files[2].dataret.length-1);
                while(nevent in events_used[1]) { nevent = rand_int(0,options.files[2].dataret.length-1); }
                var event = options.files[2].dataret[nevent];
                events_used[1][nevent] = true;
            }
            n += 1;
            
            html = '<div class="event_wrapper"><div class="event"></div></div>';
            var viewer_element = null;
            if (signal) {
                $(element).find('div.signal').append(html);
                viewer_element = $(element).find('div.signal div.event').last();
            } else {
                $(element).find('div.background').append(html);
                viewer_element = $(element).find('div.background div.event').last();
            }
            console.log('viewer_element: w:'+$(viewer_element).width()+' h:'+$(viewer_element).height());
            var next_frame = methods.next_frame;
            viewer_wrapper({domain:domain,
                            element:viewer_element,
                            randomize:false,
                            loop:false,
                            webgl:false,
                            preferred_pulseseries:['SplitOfflinePulsesHLC','OfflinePulsesHLC','HLCPulses','SplitInIcePulses','InIcePulses'],
                            bestfit_line:false,
                            smart_color:true,
                            gcdframe:options.files[options.frames[options.frameno].fileno].gcdret,
                            dataframes:[event],
                            raw_viewer:true,
                            active_artists:{accumulated_charge_counter_small:true},
                            allow_screenshot:true,
                            loader_callback:function(state,methods){
                                console.log('loaded '+event.Name);
                                methods.draw_frame();
                                methods.replace_with_image(function cb(){
                                    $(this).on('mouseleave',function(){methods.replace_with_image(cb);});
                                });
                                if (n < number_of_events)
                                    load_next_event(end_callback);
                                else
                                    end_callback();
                            }
            });
        })(function(){
            $(element).find('button.answers').on('click',function(){
                $(element).find('div.signal').toggleClass('highlight');
                if ($(this).text() == 'Reveal Signal')
                    $(this).text('Reset');
                else
                    $(this).text('Reveal Signal');
            });
        });
    };
    // make a pure loader with no display
    viewer_wrapper({domain:domain,
                    no_viewer:true,
                    element:element,
                    randomize:false,
                    loop:false,
                    files:files,
                    loader_callback:loaded
    });
};

