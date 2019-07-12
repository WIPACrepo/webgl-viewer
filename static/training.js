// veto training simulation
training = function(domain, element) {
    var quiz_length = 24;
    files = [];
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'training_veto.i3.bz2',
                frametype : 'P',
                eventtype : 'pass',
                datakeys : ['SplitOfflinePulsesHLC','SplitOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','CausalQTot','VHESelfVeto']
               });
    files.push({gcdfile : 'hese_results_IC86_GCD.i3',
                datafile : 'training_noveto.i3.bz2',
                frametype : 'P',
                eventtype : 'fail_veto_charge',
                datakeys : ['SplitOfflinePulsesHLC','SplitOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','CausalQTot','VHESelfVeto']
               });
    var right_col = function(element,options,methods){
        var type = options.frames[options.frameno].type;
        var frame = {};
        try {
            var fileno = options.frames[options.frameno].fileno;
            var frameno = options.frames[options.frameno].frameno;
            frame = options.files[fileno].dataret[frameno];
            var pass_charge = (frame['CausalQTot'] >= 6000);
            var pass_veto = !(frame['VHESelfVeto']);
            console.log('charge: '+frame['CausalQTot']+'  '+pass_charge);
            console.log('veto: '+frame['VHESelfVeto']+'  '+pass_veto);
            if (pass_charge && pass_veto)
                type = 'pass';
            else if (pass_charge)
                type = 'fail_veto';
            else if (pass_veto)
                type = 'fail_charge';
            else
                type = 'fail_veto_charge';
            console.log('type: '+type);
        } catch (e) {
            console.log('failed to get type from frame, falling back to file type');
            console.log(e);
        }
        //var html = '<img src="'+domain+'/static/IceCube_official_logo.png" width="162px" height="179px" alt="IceCube Logo" />';
        var html = '<h4 style="margin-bottom:.5em">Veto Description:</h4>';
        html += '<p style="margin-top:0;margin-left:1em">We dedicate a layer of DOMs at the detector edge and at the dust layer as &ldquo;veto DOMs.&rdquo; We then count cumulative charge vs. time in all DOMs (not only the veto DOMs) to define an &ldquo;event start&rdquo; time. This time is defined as the time when the cumulative charge reaches 250 photo-electrons (pe). If there are more than 3pe in total on the veto DOMs before that time, the event fails the veto test. We also only select events with greater than 6000pe of cleaned total charge.</p>';
        html += '<h4 style="margin-bottom:.5em">Select which type of event you think this is:</h4>';
        html += '<div class="selection" style="margin-left:10px">';
        for (var t in options.types) {
            html += '<input type="radio" name="options" value="'+t+'">'+options.types[t]+'</input><br />';
        }
        html += '</div><button class="submit" style="margin:10px auto">Submit</button>';
        html += '<div class="fiducial" style="margin:10px auto">Highlight veto DOMs: <input type="checkbox" /></div>';
        if ('CausalQTot' in frame)
            html += '<div class="charge">Cleaned Total Charge: '+(Math.round(frame['CausalQTot']*100)/100)+'pe</div>';
        html += '<div class="answer" style="min-height:200px;margin-top:20px"></div>';
        html += '<h3 class="total" style="margin:0;padding:4px;">Total: '+options.correct+'/'+options.asked+'</h3>';
        html += '<div><button class="reset_count">Reset Counter</button></div>';
        $(element).html(html);
        

        var reset_counter = function( ) {
            options.correct = 0;
            options.asked = 0;
            $(element).find('.total').text('Total: '+options.correct+'/'+options.asked);
        }
        
        if (options.show_fiducial)
            $(element).find('.fiducial input').prop('checked', true);
        $(element).find('.fiducial input').on('change',function(){
            methods.set_fiducial(this.checked);
            options.show_fiducial = this.checked;
        });
        
        $(element).find('.submit').on('click',function(){
            var checked = $(element).find('.selection input:checked').attr('value');
            if (checked != null && checked != undefined && checked in options.types) {
                var html = '<h3 style="margin-top:0">You selected '+options.types[checked]+'</h3>';
                if (type == checked) {
                    options.correct++;
                    html += '<h3>That is <span style="color:green">correct</span></h3>';
                } else {
                    html += '<h3>The correct answer is '+options.types[type]+'</h3>';
                }
                options.asked++;
                html += '<h4>'+options.type_explanation[type]+'</h4>';
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
    var html = '<h4 style="margin-bottom:0">Learn about the veto event selection used in the IceCube analysis to select very high energy neutrinos. ';
    html += 'Remember, we select only those events that started in the detector to distinguish them from very high energy muons, which are already ';
    html += 'interacting with the ice as they enter the detector.</h4>';
    html += '<h5 style="text-align:right;margin: .5em 0 .6em">You can rotate events to view from a different angle.</h5>';
    $(element).before(html);
    viewer_wrapper({domain:domain,
                    element:element,
                    files:files,
                    pulse_choose:false,
                    preferred_pulseseries:['SplitOfflinePulsesHLC'],
                    bestfit_line:false,
                    show_fiducial:true,
                    right_col_offset:310,
                    right_col_callback:right_col,
                    types:{pass:'Passes Veto and Charge Cut',
                           fail_charge:'Passes Veto, Fails Charge Cut',
                           fail_veto:'Fails Veto, Passes Charge Cut',
                           fail_veto_charge:'Fails Veto and Charge Cut',
                    },
                    type_explanation:{
                        pass:'This event passed the outer veto and charge cut.',
                        fail_charge:'This event passed the outer veto, but did not pass the charge cut.',
                        fail_veto:'This event passed the charge cut, but did not pass the outer veto.',
                        fail_veto_charge:'This event did not pass both the outer veto and the charge cut.'
                    },
                    correct:0,
                    asked:0
    });
};

