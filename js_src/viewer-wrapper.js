// viewer wrapper (interface around the viewer)

viewer_wrapper = (function ( $ ) {
    var state = {};

    var private_methods = {

        loaded : function( state ) {
            // get all the frames from all the files
            state.frames = [];
            for (var i=0;i<state.files.length;i++) {
                if (state.files[i].dataret == undefined) {
                    alert('error loading file '+i);
                    return;
                }
                var select_events = {};
                if ('eventids' in state.files[i])
                    select_events = convertToAssociative(state.files[i].eventids);
                for (var j=0;j<state.files[i].dataret.length;j++) {
                    if ('eventids' in state.files[i] && !(j in select_events)) {
                        console.log('skipping file '+i+' frame '+j);
                        continue;
                    }
                    state.frames.push({fileno : i,
                                      frameno : j,
                                      type : state.files[i].eventtype
                                     });
                }
            }
            if (state.randomize) {
                // shuffle frames
                fisher_yates(state.frames);
            }

            // start with the first frame
            state.frameno = 0;
            private_methods.get_frameno(state);
            public_methods.draw_frame(state);
            public_methods.draw(state);

            // remove loader message so people can see stuff
            $('#loader').remove();

            if (state.loader_callback != undefined) {
                var methods = {};
                if (!state.no_viewer) {
                    for(var m in state.viewer) {
                        methods[m] = state.viewer[m];
                    }
                }
                for (var m in public_methods) {
                    methods[m] = partial(public_methods[m],state)
                }
                state.loader_callback(state,methods);
            }
        },
        get_frameno : function( state ) {
            var hash = location.hash;
            if (hash != undefined && hash != null) {
                var ret = parseInt(hash.substring(1),10);
                if (!isNaN(ret))
                    state.frameno = ret;
            }
        },
        set_frameno : function( state ) {
            if (history.pushState) {
                history.replaceState(null,null,'#'+state.frameno);
            } else {
                location.hash = '#'+state.frameno;
            }
        }
    };

    var public_methods = {
        next_frame : function( state ) {
            state.frameno += 1;
            if (state.frameno >= state.frames.length) {
                if (state.loop)
                    state.frameno = 0;
                else
                    return false;
            }
            return true;
        },
        prev_frame : function( state ) {
            if (state.frameno <= 0) {
                if (state.loop)
                    state.frameno = state.frames.length-1;
                else
                    return false;
            } else {
                state.frameno -= 1;
            }
            return true;
        },
        draw_frame : function( state, frame ) {
            if (state.no_viewer)
                return;
            if (state.files.length < 1) {
                state.viewer.set_gcd_data(state.gcdframe,state.dataframes);
            } else {
                if (frame == undefined) {
                    frame = state.frameno;
                }
                if (frame < 0 || frame >= state.frames.length) {
                    alert('frame number '+frame+' out of range');
                    return;
                }
                var fileno = state.frames[frame].fileno;
                var frameno = state.frames[frame].frameno;
                state.viewer.set_gcd_data(state.files[fileno].gcdret,
                                          [state.files[fileno].dataret[frameno]]);
            }
        },
        draw : function( state ) {
            // draw elements
            var methods = {};
            if (!state.no_viewer) {
                for(var m in state.viewer) {
                    methods[m] = state.viewer[m];
                }
            }
            for (var m in public_methods) {
                methods[m] = partial(public_methods[m],state)
            }
            state.right_col_callback($(state.element).find('.viewer_right_col'),state,methods);
        }
    };

    var init = function(options) {
        options = $.extend({
            domain : '/',
            element : $(document),
            raw_viewer : false,
            no_viewer : false,
            navigation : undefined,
            show_fiducial : undefined,
            active_artists : undefined,
            right_col_offset : 0,
            right_col_callback : function(element,opts,methods){ return; },
            loader_callback : undefined,
            pulse_choose : undefined,
            preferred_pulseseries : undefined,
            bestfit_line : undefined,
            smart_color : undefined,
            force_color_times : undefined,
            color_begin : undefined,
            color_end : undefined,
            randomize : true,
            loop : true,
            files : [],
            frames : [],
            gcdframe : undefined,
            dataframes : undefined,
            frameno : 0,
            downloader : undefined,
            viewer : undefined,
            webgl : undefined,
            allow_screenshot : false
        },options);
        options.downloader = partial(viewerAjaxCaller,options.domain+'/ajax');

        setDomain(options.domain);

        if (options.element) {
            options.width = $(options.element).innerWidth();
            options.height = $(options.element).innerHeight();
        }
        if (!options.no_viewer) {
            console.log('width:'+options.width+' height:'+options.height);

            var html = '<div class="viewer" style="display:inline-block;vertical-align:top;';
            html += 'width:'+(options.width-options.right_col_offset)+'px;height:'+options.height+'px"></div>';
            if (!options.raw_viewer && options.right_col_offset >= 10) {
                html += '<div class="viewer_right_col" style="display:inline-block;vertical-align:top;';
                html += 'width:'+(options.right_col_offset-10)+'px;margin-left:10px"></div>';
            }
            $(options.element).html(html);

            var viewer_options = {domain: domain,
                                  element: $(options.element).children('div.viewer').first(),
                                  navigation: options.navigation||options.raw_viewer,
                                  raw_viewer: options.raw_viewer,
                                  show_fiducial: options.show_fiducial,
                                  active_artists: options.active_artists,
                                  webgl: options.webgl,
                                  allow_screenshot: options.allow_screenshot
            };
            if (options.preferred_pulseseries != undefined)
                viewer_options['preferred_pulseseries'] = options.preferred_pulseseries
            if (options.pulse_choose != undefined)
                viewer_options['pulse_choose'] = options.pulse_choose
            if (options.bestfit_line != undefined)
                viewer_options['bestfit_line'] = options.bestfit_line
            if (options.smart_color != undefined)
                viewer_options['smart_color'] = options.smart_color
            if (options.force_color_times != undefined && options.color_begin != undefined && options.color_end != undefined) {
                console.log('set color times')
                viewer_options['force_color_times'] = options.force_color_times;
                viewer_options['color_begin'] = options.color_begin;
                viewer_options['color_end'] = options.color_end;
            }
            if (options.files.length < 1) {
                console.log('make viewer with callback');
                options.viewer = IceCubeViewer(viewer_options,function(viewer){
                    console.log('viewer callback');
                    var methods = {};
                    for(var m in viewer) {
                        methods[m] = viewer[m];
                    }
                    for (var m in public_methods) {
                        methods[m] = partial(public_methods[m],options)
                    }
                    if (options.loader_callback != undefined)
                        options.loader_callback(options,methods);
                });
            } else {
                console.log('load files and make viewer with callback');
                options.viewer = IceCubeViewer(viewer_options,function(viewer){
                    html = '<div id="loader" style="width:'+options.width+'px;height:'+options.height+'px;';
                    html += 'margin:0;left:0;top:0;padding:0;position:fixed;z-index:10;display:block;text-align:center;vertical-align:center;background-color:#999">';
                    html += '<h1 style="width:200px;height:50px;text-align:center;margin:'+(options.height/2-50)+'px auto 15px;">Loading...</h1>';
                    html += '<img src="'+domain+'/static/loader.gif" height="50" width="50" style="margin:auto;text-align:center" /></div>';
                    $(options.element).prepend(html);
                    //$(options.element).hide();

                    var loader_data = {};
                    for (var i=0;i<options.files.length;i++) {
                        loader_data[i+'g'] = {'function':'getGCD',
                                              'gcd_filename':options.files[i].gcdfile};
                        loader_data[i+'d'] = {'function':'getI3',
                                               'i3_filename':options.files[i].datafile,
                                               'frame_type':options.files[i].frametype};
                        if ('datakeys' in options.files[i])
                            loader_data[i+'d'].keys = options.files[i].datakeys.join(',');
                    }
                    file_loader({waiting:loader_data,
                                 downloader:options.downloader,
                                 callback:function(success,failed){
                                    console.log('callback')
                                    if (!isAssociativeEmpty(failed)) {
                                        alert('failed to load all files');
                                    } else {
                                        for (var i=0;i<options.files.length;i++) {
                                            options.files[i].gcdret = success[i+'g']['data'];
                                            options.files[i].dataret = success[i+'d']['data'];
                                        }
                                        private_methods.loaded(options);
                                    }
                                 }
                    })('start');
                });
            }
            if (!options.viewer) {
                console.warn('removing viewer');
                $('#loader').remove();
                $('#main').remove();
                Detector.addGetWebGLMessage();
                return false;
            }
            options.viewer.set_center(50,50,-50);
            options.viewer.set_camera(1250,-460,300);
        } else if (options.files.length > 0) {
            console.log('load files without viewer');
            html = '<div id="loader" style="width:'+options.width+'px;height:'+options.height+'px;';
            html += 'margin:0;left:0;top:0;padding:0;position:fixed;z-index:10;display:block;text-align:center;vertical-align:center;background-color:#999">';
            html += '<h1 style="width:200px;height:50px;text-align:center;margin:'+(options.height/2-50)+'px auto 15px;">Loading...</h1>';
            html += '<img src="'+domain+'/static/loader.gif" height="50" width="50" style="margin:auto;text-align:center" /></div>';
            $(options.element).prepend(html);
            //$(options.element).hide();

            var loader_data = {};
            for (var i=0;i<options.files.length;i++) {
                loader_data[i+'g'] = {'function':'getGCD',
                                      'gcd_filename':options.files[i].gcdfile};
                loader_data[i+'d'] = {'function':'getI3',
                                       'i3_filename':options.files[i].datafile,
                                       'frame_type':options.files[i].frametype};
                if ('datakeys' in options.files[i])
                    loader_data[i+'d'].keys = options.files[i].datakeys.join(',');
            }
            file_loader({waiting:loader_data,
                         downloader:options.downloader,
                         callback:function(success,failed){
                            console.log('callback')
                            if (!isAssociativeEmpty(failed)) {
                                alert('failed to load all files');
                            } else {
                                for (var i=0;i<options.files.length;i++) {
                                    options.files[i].gcdret = success[i+'g']['data'];
                                    options.files[i].dataret = success[i+'d']['data'];
                                }
                                private_methods.loaded(options);
                            }
                         }
            })('start');
        }

        return options;
    }

    return function( options ){
        var state = init(options);
        console.log('init ret:'+state);

        var methods = {};
        for(var m in state.viewer) {
            methods[m] = state.viewer[m];
        }
        for(var m in public_methods) {
            methods[m] = partial(public_methods[m], state);
        }
        return methods;
    };
})(jQuery);
