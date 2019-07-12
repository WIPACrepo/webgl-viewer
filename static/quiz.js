// particle quiz
quiz = function(domain, element) {
    var quiz_length = 12;
    
    files = [];
  /*  files.push({gcdfile : 'Diffuse-HEEvents_unblinded.i3.gz',
                datafile : 'Diffuse-HEEvents_unblinded.i3.gz',
                frametype : 'P',
                eventtype : 'numu'
               });*/
    files.push({gcdfile : 'Diffuse-HEEvents_unblinded.i3_GCD.i3.gz',
                datafile : 'Diffuse-HEEvents_unblinded.i3_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'up',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'downgoing.i3_GCD.i3.gz',
                datafile : 'downgoing.i3_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'down',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'upgoing_jvs_GCD.i3.bz2',
                datafile : 'upgoing_jvs_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'up',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'cascade_GCD.i3.bz2',
                datafile : 'cascade_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'cascade',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'cascade2_GCD.i3.gz',
                datafile : 'cascade2_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'cascade',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'CoincidentEvents.i3_GCD.i3.gz',
                datafile : 'CoincidentEvents.i3_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'coincident',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'PhysicsFairUp_GCD.i3.gz',
                datafile : 'PhysicsFairUp_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'up',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'PhysicsFairDown_GCD.i3.gz',
                datafile : 'PhysicsFairDown_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'down',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'PhysicsFairCascade_GCD.i3.gz',
                datafile : 'PhysicsFairCascade_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'cascade',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
    files.push({gcdfile : 'PhysicsFairCoincident_GCD.i3.gz',
                datafile : 'PhysicsFairCoincident_DATA.i3.gz',
                frametype : 'P',
                eventtype : 'coincident',
                datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','OfflinePulseSeriesReco']
               });
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
        var html = '<h4 style="margin-bottom:6px">Select which type of event you think this is:</h4>';
        html += '<div class="selection" style="margin-left:10px">';
        for (var type in options.types) {
            html += '<input type="radio" name="options" value="'+type+'">'+options.types[type]+'</input><br />';
        }
        html += '</div><button class="submit" style="margin-top:10px;">Submit</button><br />';
        html += '<div class="answer" style="min-height:250px;margin-top:20px"></div>';
        html += '<h3 class="total" style="margin:0;padding:4px;">Total: '+options.correct+'/'+options.asked+'</h3>';
        html += '<div><button class="reset_count">Reset Counter</button></div>';
        $(element).html(html);

        var reset_counter = function( ) {
            options.correct = 0;
            options.asked = 0;
            $(element).find('.total').text('Total: '+options.correct+'/'+options.asked);
        }
        
        $(element).find('.submit').on('click',function(){
            var checked = $(element).find('.selection input:checked').attr('value');
            if (checked != null && checked != undefined && checked in options.types) {
                var html = '<h3 style="margin-top:0">You selected '+options.types[checked]+'</h3>';
                if (options.frames[options.frameno].type == checked) {
                    options.correct++;
                    html += '<h3>That is <span style="color:green">correct</span></h3>';
                } else {
                    html += '<h3>The correct answer is '+options.types[options.frames[options.frameno].type]+'</h3>';
                }
                options.asked++;
                html += '<h4>'+options.type_explanation[options.frames[options.frameno].type]+'</h4>';
                if (options.asked % quiz_length == 0) {
                    html += '<h3>Your final score was '+options.correct+'/'+quiz_length+'.  Thanks for participating in the particle search!</h3>';
                    html += '<button class="next_frame" style="margin:7px 0 20px">Restart Quiz</button>';
                } else {
                    html += '<button class="next_frame" style="margin-top:7px">Next Event</button>';
                }
                $(element).find('.selection input').prop('disabled',true);
                $(element).find('.submit').prop('disabled',true);
                $(element).find('.answer').html(html);
                $(element).find('.total').text('Total: '+options.correct+'/'+options.asked);
                $(element).find('.next_frame').on('click',function(){
                    methods.next_frame();
                    if (options.asked % quiz_length == 0) { reset_counter(); }
                    methods.draw_frame();
                    methods.draw();
                });
            }
        });
        $(element).find('.reset_count').on('click',reset_counter);
    };
    var html = '<h4>Learn about the different types of particles IceCube can see.</h4>';
    html += '<h5 style="text-align:right;margin: 3px 0">You can rotate events to view from a different angle.</h5>';
    $(element).before(html);
    viewer_wrapper({domain:domain,
                    element:element,
                    files:files,
                    pulse_choose:false,
                    bestfit_line:false,
                    right_col_offset:310,
                    right_col_callback:right_col,
                    types:{up:'Upgoing track',
                           down:'Downgoing track',
                           cascade:'Cascade',
                           coincident:'Coincident events'
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

