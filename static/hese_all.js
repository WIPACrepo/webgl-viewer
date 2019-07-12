// high energy starting events - all 28 on one page
hese_all = function(domain, element) {
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
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'hese_results_IC86_2.i3',
                frametype : 'P',
                datakeys : ['HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
               });
    /*files.push({
            gcdfile : 'IC59_GCD.i3.gz',
            datafile : 'aachen_IC59.i3.gz',
            frametype : 'P',
            datakeys : ['HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','TWOfflinePulseSeriesReco','OfflinePulseSeriesReco','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        });
    files.push({
            gcdfile : 'hese_results_IC79_GCD.i3',
            datafile : 'aachen_IC79.i3.gz',
            frametype : 'P',
            datakeys : ['HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','TWOfflinePulsesHLC','OfflinePulsesHLC','MaskedOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        });
    files.push({
            gcdfile : 'hese_results_IC86_GCD.i3',
            datafile : 'aachen_IC86.i3.gz',
            frametype : 'P',
            datakeys : ['OfflinePulsesHLC','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','TWOfflinePulsesHLC','TWSRTOfflinePulses','SRTOfflinePulses','SRTInIcePulses','MaskedOfflinePulses','OfflinePulses','InIceDSTPulses','InIceDSTOnlyPulses','I3SuperDST','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        });*/
    var loaded = function(options,methods){
        console.log('loaded');
        var html = '<div style="margin-bottom:20px">';
        html += '<h4 style="margin: 3px 0">IceCube found 37 very high energy events in data collected from May 2010 to May 2013. ';
        html += 'They constitute the first solid evidence for astrophysical neutrinos from cosmic accelerators.<br />';
        html += 'Can you guess which are the five with the highest energy?</h4></div>';
        $(element).prepend(html);
        var events = [];
        while (true) {
            var event = options.files[options.frames[options.frameno].fileno].dataret[options.frames[options.frameno].frameno];
            var det = 'ic79';
            if (options.frames[options.frameno].fileno == 1)
                det = 'ic86_1';
            else if (options.frames[options.frameno].fileno == 2)
                det = 'ic86_2';
            events.push({data: event,
                         gcd: options.files[options.frames[options.frameno].fileno].gcdret,
                         index: events.length+1,
                         detector: det
            });
            if (!methods.next_frame())
                break
        }
        var event_mapping = {}, event_mapping_list = [];
        for (var i=0;i<events.length;i++)
            event_mapping[i] = 1;
        
        function make_frame_counter() {
            var i = 0, name;
            event_mapping_list = [];
            for (name in event_mapping) {
                if (event_mapping.hasOwnProperty(name) && event_mapping[name] == 1) {
                    var j=0;
                    for (;j<event_mapping_list.length;j++) {
                        if (parseInt(event_mapping_list[j],10) > parseInt(name,10)) {
                            event_mapping_list.splice(j,0,name)
                            break;
                        }
                    }
                    if (j == event_mapping_list.length)
                        event_mapping_list.push(name);
                }
            }
            return function(){
                if (i >= event_mapping_list.length || i >= 40) // set hard cap at 20 events
                    return false;
                else
                    return i++;
            };
        };
        function draw() {
            var highest_energy = {};
            var num_highest_energy = 5;
            var min_high_energy = undefined;
            var next_frame = make_frame_counter();
            (function load_next_event(event_id,end_callback){
                console.log('event id: '+event_id);
                var event = events[event_mapping_list[event_id]].data
                var gcd = events[event_mapping_list[event_id]].gcd;
                var index = events[event_mapping_list[event_id]].index;
                console.log('event energy: '+event.energy);
                if (event.energy != undefined) {
                    if (associativeLength(highest_energy) < num_highest_energy) {
                        highest_energy[event_id] = event.energy;
                        if (min_high_energy == undefined || event.energy < min_high_energy) {
                            min_high_energy = event.energy;
                        }
                    } else if (event.energy > min_high_energy) {
                        highest_energy[event_id] = event.energy;
                        // remove lowest energy event
                        var lowest_event = undefined;
                        var second_lowest_energy = undefined;
                        for (var h in highest_energy) {
                            if (lowest_event == undefined || highest_energy[h] < highest_energy[lowest_event]) {
                                lowest_event = h;
                            }
                            if (highest_energy[h] > min_high_energy && (second_lowest_energy == undefined || highest_energy[h] < second_lowest_energy)) {
                                second_lowest_energy = highest_energy[h];
                            }
                        }
                        delete highest_energy[lowest_event];
                        min_high_energy = second_lowest_energy;
                    }
                }
                html = '<div class="event_wrapper"><div class="name">'+index;
                if ('Name' in event)
                    html += ' - '+event.Name;
                html += '</div><div class="event"></div>';
                html += '<div class="energy">Energy: '+event.energy;
                if (event.energy !== undefined)
                    html += ' TeV';
                html += '</div><div class="event_selector">';
                html += 'Select event: <input type="checkbox" name="event" value="'+index+'" />';
                html += '</div></div>';
                $(element).append(html);
                var viewer_element = $(element).find('div.event').last();
                console.log('viewer_element: w:'+$(viewer_element).width()+' h:'+$(viewer_element).height());
                viewer_wrapper({domain:domain,
                                element:viewer_element,
                                randomize:false,
                                loop:false,
                                webgl:false,
                                preferred_pulseseries:['HLCPulses','TWOfflinePulsesHLC','TWSRTOfflinePulses','SRTOfflinePulses','SRTInIcePulses'],
                                bestfit_line:false,
                                force_color_times:true,
                                color_begin:event['VHESelfVetoVertexTime'],
                                color_end:event['VHESelfVetoVertexTime']+3000,
                                gcdframe:gcd,
                                dataframes:[event],
                                raw_viewer:true,
                                active_artists:{},
                                allow_screenshot:true,
                                loader_callback:function(state,methods){
                                    console.log('loaded '+event.Name);
                                    methods.draw_frame();
                                    methods.replace_with_image(function cb(){
                                        $(this).on('mouseleave',function(){methods.replace_with_image(cb);});
                                    });
                                    var id = next_frame()
                                    if (id === false)
                                        end_callback();
                                    else
                                        load_next_event(id,end_callback);
                                }
                });
            })(next_frame(),function(){
                console.log('highest_energy');
                console.log(highest_energy);
                $(element).find('div.event_wrapper').each(function(index){
                    if (index in highest_energy)
                        $(this).addClass('highest_energy');
                });
                $(element).find('div.event_selector input').on('change',function(){
                    var parent = $(this).parent().parent();
                    if (this.checked && !$(parent).hasClass('selected')) {
                        $(parent).addClass('selected');
                    } else if ((!this.checked) && $(parent).hasClass('selected')) {
                        $(parent).removeClass('selected');
                    }
                });
                $(element).find('button.hints').on('click',function(){
                    // remove 1/4 of wrong and unselected answers
                    var low_energy = $(element).find('div.event_wrapper:not(.selected):not(.highest_energy)');
                    console.log('hinting by removing '+(low_energy.length/4)+' items');
                    fisher_yates(low_energy);
                    for(var i=0;i<low_energy.length/4;i++) {
                        $(low_energy[i]).remove();
                    }
                });
                var checks = 0;
                $(element).find('button.answers').on('click',function(){
                    if (checks > 0) {
                        $(element).find('.highest_energy.selected').toggleClass('highlight');
                        $(element).toggleClass('highlight');
                    } else {
                        checks++;
                        $(element).find('.highest_energy.selected').addClass('highlight');
                        $(this).text('Show answers');
                    }
                });
            });
        }
        // do filtering
        (function(){
            var html = '<div class="filter"><h4>Filter events?</h4>';
            html += '<div class="hist_wrapper"><div class="header_controls"></div>';
            html += '<div class="histogram charge_hist"></div>';
            html += '<div class="footer_controls"></div>';
            html += '<div class="submit"><button class="submit">Start drawing</button></div>';
            html += '</div></div>';
            $(element).append(html);
            // draw histogram
            var start_date = new Date('2010-05-31T07:08:28'),
                end_date = new Date('2013-05-02T10:16:23'),
                end_ms = end_date-start_date,
                width = $(element).find('div.histogram').width(),
                nbins = width - 2,
                bins = [], height = 50;
            console.log(start_date);
            console.log(end_date);
            for (var i=0;i<nbins;i++) {
                bins.push(0);
            }
            for (var i=0;i<events.length;i++) {
                console.log(MJD_to_date(events[i].data.time));
                var b = Math.floor((MJD_to_date(events[i].data.time)-start_date)*nbins/end_ms);
                bins[b] += 1;
            }
            
            var header_width = nbins - 4,
                width_outer = Math.floor(header_width/3),
                width_inner = header_width - 2*width_outer;
            html = '<div class="ic79 active" style="width:'+width_outer+'px">';
            html += '<a href="#">IC 79</a></div>';
            html += '<div class="ic86_1 active" style="width:'+width_inner+'px">';
            html += '<a href="#">IC 86 - Year 1</a></div>';
            html += '<div class="ic86_2 active" style="width:'+width_outer+'px">';
            html += '<a href="#">IC 86 - Year 2</a></div>';
            $(element).find('div.header_controls').append(html);
            
            html = '';
            for (var i=0;i<nbins;i++) {
                html += '<div class="hist_data ';
                if (i < width_outer+2)
                    html += 'ic79 ';
                else if (i < width_outer+width_inner+3)
                    html += 'ic86_1 ';
                else
                    html += 'ic86_2 ';
                if (bins[i] > 0)
                    html += 'events ';
                html += 'active" style="height:'+height+'px"></div>';
            }
            $(element).find('div.histogram').append(html);
            
            var max_left = -15,
                max_right = nbins;
            html  = '<div class="control left_control" style="left:'+max_left+'px"></div>';
            html += '<div class="control right_control" style="left:'+max_right+'px"></div>';
            html += '<div class="time_label"></div>';
            $(element).find('div.footer_controls').append(html);
            console.log('max_left:'+max_left+'  max_right:'+max_right);
            
            $(element).children().last().on('mousedown vmousedown touchstart','div.footer_controls .control',function(e){
                //console.log('dragging');
                e.stopPropagation();
                if (e.type == 'touchstart') {
                    e.pageX = e.originalEvent.touches[0].pageX;
                    e.pageY = e.originalEvent.touches[0].pageY;
                    e.originalEvent.preventDefault();
                }
                $(this).addClass('active');
                var hist_offsetX = $(this).parent().offset().left,
                    orig_offsetX = e.pageX-$(this).offset().left,
                    obj = this;
                    parent = $(this).parent();
                    time_label = $(parent).children('.time_label');
                function set_time(t) {
                    console.log('set_time: '+t);
                    var d = new Date(start_date.getTime()+(end_date-start_date)*t/nbins);
                    $(time_label).text(d.getUTCFullYear()+'/'+(d.getUTCMonth()+1)+'/'+d.getUTCDate());
                    if ($(time_label).width()+t > max_right)
                        $(time_label).css({left:'auto',right:0});
                    else
                        $(time_label).css({left:t,right:'auto'});
                }
                if ($(this).hasClass('left_control'))
                    set_time($(this).offset().left-hist_offsetX+15);
                else
                    set_time($(this).offset().left-hist_offsetX);
                $(element).find('.hist_wrapper').on('mousemove vmousemove touchmove',function(e){
                    if (e.type == 'touchmove') {
                        e.pageX = e.originalEvent.touches[0].pageX;
                        e.pageY = e.originalEvent.touches[0].pageY;
                        e.originalEvent.preventDefault();
                    }
                    var posX = $(obj).offset().left,
                        offsetX = e.pageX-posX-orig_offsetX,
                        newX = posX+offsetX-hist_offsetX;
                    //console.log('drag')
                    //console.log([posX,offsetX,newX]);
                    if ($(obj).hasClass('left_control') && 
                        ((newX+15+hist_offsetX >= $(parent).children('.right_control').offset().left)
                        || newX < max_left || newX+15 > max_right))
                        return;
                    if ($(obj).hasClass('right_control') && 
                        ((newX+hist_offsetX <= $(parent).children('.left_control').offset().left+15)
                        || newX-15 < max_left || newX > max_right))
                        return;
                    $(obj).css('left',newX);
                    if ($(this).hasClass('left_control'))
                        set_time(newX+15);
                    else
                        set_time(newX);
                    var left_pos = $(parent).children('.left_control').offset().left-hist_offsetX+15,
                        right_pos = $(parent).children('.right_control').offset().left-hist_offsetX;
                    $(element).find('div.histogram div.hist_data').each(function(i){
                        if (i < left_pos && $(this).hasClass('active'))
                            $(this).removeClass('active');
                        else if (i >= left_pos && i < right_pos && !$(this).hasClass('active'))
                            $(this).addClass('active');
                        else if (i >= right_pos && $(this).hasClass('active'))
                            $(this).removeClass('active');
                    });
                }).on('mouseup mouseleave mousecancel vmouseup vmousecancel touchend touchcancel',function(e){
                    //console.log('end drag');
                    if (e.type == 'touchend' || e.type == 'touchcancel') {
                        e.originalEvent.preventDefault();
                    }
                    $(element).find('.hist_wrapper').off('mousemove mouseup mouseleave mousecancel vmousemove vmouseup vmousecancel touchmove touchend touchcancel');
                    $(obj).removeClass('active');
                });
            }).on('click','.header_controls > div',function(){
                var det = ''
                if ($(this).hasClass('ic79'))
                    det = 'ic79';
                else if ($(this).hasClass('ic86_1'))
                    det = 'ic86_1';
                else if ($(this).hasClass('ic86_2'))
                    det = 'ic86_2';
                else
                    return;
                var val = 1;
                if ($(this).hasClass('active'))
                    val = 0;
                $(this).toggleClass('active');
                if (val)
                    $(element).find('div.histogram div.hist_data.'+det+':not(.active)').addClass('active');
                else
                    $(element).find('div.histogram div.hist_data.'+det+'.active').removeClass('active');
            }).on('click','button.submit',function(){
                var index = 0;
                $(element).find('div.histogram div.hist_data').each(function(i){
                    if (!$(this).hasClass('events'))
                        return;
                    var val = 0;
                    if ($(this).hasClass('active'))
                        val = 1;
                    while (bins[i] > 0) {
                        event_mapping[index] = val;
                        bins[i]--;
                        index++;
                    };
                });
                $(element).children().last().off().remove();
                var html = '<h5 style="float:right;margin: 3px 0">You can rotate events to view from a different angle.</h5>';
                html += '<button class="hints" style="margin-right:2em">Remove some events</button>';
                html += '<button class="answers">Check selection</button>';
                $(element).children().first().append(html);
                draw();
            });
        })();
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

