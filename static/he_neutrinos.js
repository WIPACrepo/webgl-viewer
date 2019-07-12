// high energy events
he_neutrinos = function(domain, element) {
    var files = {
//        hese79: {
//            gcdfile : 'hese_results_IC79_GCD.i3',
//            datafile : 'hese_results_IC79.i3',
//            frametype : 'P',
//            datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
//        },
        hese86_1: {
            gcdfile : 'hese_results_IC86_GCD.i3',
            datafile : 'hese_results_IC86.i3',
            frametype : 'P',
            datakeys : ['HLCPulses','SplitOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        },
        hese86_2: {
            gcdfile : 'hese_results_IC86_GCD.i3',
            datafile : 'hese_results_IC86_2.i3',
            frametype : 'P',
            datakeys : ['HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        },
        aachen_59: {
            gcdfile : 'IC59_GCD.i3.gz',
            datafile : 'aachen_IC59.i3.gz',
            frametype : 'P',
            datakeys : ['TWOfflinePulseSeriesReco','OfflinePulseSeriesReco','HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        },
        aachen_79: {
            gcdfile : 'hese_results_IC79_GCD.i3',
            datafile : 'aachen_IC79.i3.gz',
            frametype : 'P',
            datakeys : ['TWOfflinePulsesHLC','OfflinePulsesHLC','HLCPulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','MaskedOfflinePulses','OfflinePulses','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        },
        aachen_86: {
            gcdfile : 'hese_results_IC86_GCD.i3',
            datafile : 'aachen_IC86.i3.gz',
            frametype : 'P',
            datakeys : ['TWOfflinePulsesHLC','TWSRTOfflinePulses','OfflinePulsesHLC','SRTOfflinePulses','SRTInIcePulses','SplitInIcePulses','InIcePulses','ReextractedInIcePulses','MaskedOfflinePulses','OfflinePulses','InIceDSTPulses','InIceDSTOnlyPulses','I3SuperDST','Name','energy','time','declination','right_ascension','angular_error','type','Qtot','VHESelfVeto','VHESelfVetoVertexTime']
        }
    };
    var viewer_files = [files.hese86_1, files.hese86_2, files.aachen_59, files.aachen_79, files.aachen_86]
    var events = [
//        {file: "hese79", index:0, energy: 47.6, date: "2010-06-04", type: "cascade"},
//        {file: "hese79", index:1, energy: 117., date: "2010-06-04", type: "cascade"},
//        {file: "hese79", index:2, energy: 78.7, date: "2010-09-12", type: "track"},
//        {file: "hese79", index:3, energy: 165., date: "2010-10-08", type: "cascade"},
//        {file: "hese79", index:4, energy: 71.4, date: "2010-11-13", type: "track"},
//        {file: "hese79", index:5, energy: 28.4, date: "2011-01-07", type: "cascade"},
//        {file: "hese79", index:6, energy: 34.3, date: "2011-01-10", type: "cascade"},
//        {file: "hese79", index:7, energy: 32.6, date: "2011-02-17", type: "track"},
//        {file: "hese79", index:8, energy: 63.2, date: "2011-05-05", type: "cascade"},
//        {file: "hese86_1", index:0, energy: 97.2, date: "2011-05-14", type: "cascade"},
//        {file: "hese86_1", index:1, energy: 88.4, date: "2011-06-03", type: "cascade"},
//        {file: "hese86_1", index:2, energy: 104., date: "2011-06-27", type: "cascade"},
        {file: "hese86_1", index:3, energy: 253., date: "2011-07-14", type: "track"},
        {file: "hese86_1", index:4, energy: 1041., date: "2011-08-10", type: "cascade"},
//        {file: "hese86_1", index:5, energy: 57.5, date: "2011-08-10", type: "cascade"},
//        {file: "hese86_1", index:6, energy: 30.6, date: "2011-08-26", type: "cascade"},
        {file: "hese86_1", index:7, energy: 200., date: "2011-08-27", type: "cascade"},
//        {file: "hese86_1", index:8, energy: 31.5, date: "2011-12-29", type: "track"},
//        {file: "hese86_1", index:9, energy: 71.5, date: "2011-12-31", type: "cascade"},
        {file: "hese86_1", index:10, energy: 1141., date: "2012-01-03", type: "cascade"},
//        {file: "hese86_1", index:11, energy: 30.2, date: "2012-01-11", type: "cascade"},
        {file: "hese86_1", index:12, energy: 220., date: "2012-01-16", type: "cascade"},
//        {file: "hese86_1", index:13, energy: 82.2, date: "2012-01-24", type: "track"},
//        {file: "hese86_1", index:14, energy: 30.5, date: "2012-01-25", type: "cascade"},
//        {file: "hese86_1", index:15, energy: 33.5, date: "2012-02-10", type: "cascade"},
        {file: "hese86_1", index:16, energy: 210., date: "2012-02-22", type: "cascade"},
//        {file: "hese86_1", index:17, energy: 60.2, date: "2012-03-23", type: "cascade"},
//        {file: "hese86_1", index:18, energy: 46.1, date: "2012-05-02", type: "track"},
//        {file: "hese86_2", index:0, energy: 32.7, date: "2012-06-30", type: "cascade"},
//        {file: "hese86_2", index:1, energy: 129, date: "2012-08-17", type: "cascade"},
//        {file: "hese86_2", index:2, energy: 78.3, date: "2012-09-06", type: "cascade"},
//        {file: "hese86_2", index:3, energy: -1, date: "2012-10-12", type: "coincident"},
        {file: "hese86_2", index:4, energy: 385., date: "2012-10-21", type: "cascade"},
//        {file: "hese86_2", index:5, energy: 42.1, date: "2012-10-29", type: "cascade"},
        {file: "hese86_2", index:6, energy: 2004., date: "2012-12-04", type: "cascade"},
//        {file: "hese86_2", index:7, energy: 28.9, date: "2013-01-16", type: "cascade"},
//        {file: "hese86_2", index:8, energy: 30.8, date: "2013-04-08", type: "track"},
        {file: "aachen_59", index:0, energy: 480, date: "2009-08-13", type: "track"},
        {file: "aachen_59", index:1, energy: 250, date: "2009-11-06", type: "track"},
        {file: "aachen_79", index:0, energy: 340, date: "2010-06-08", type: "track"},
        {file: "aachen_79", index:1, energy: 260, date: "2010-06-23", type: "track"},
        {file: "aachen_79", index:2, energy: 230, date: "2010-07-10", type: "track"},
        {file: "aachen_79", index:3, energy: 770, date: "2010-08-13", type: "track"},
        {file: "aachen_79", index:4, energy: 460, date: "2010-09-25", type: "track"},
        {file: "aachen_79", index:5, energy: 660, date: "2010-10-09", type: "track"},
        {file: "aachen_79", index:6, energy: 950, date: "2010-10-28", type: "track"},
        {file: "aachen_79", index:7, energy: 520, date: "2010-11-13", type: "track"},
        {file: "aachen_79", index:8, energy: 240, date: "2011-01-28", type: "track"},
        {file: "aachen_86", index:0, energy: 300, date: "2011-05-21", type: "track"},
        {file: "aachen_86", index:1, energy: 210, date: "2011-06-10", type: "track"},
        {file: "aachen_86", index:2, energy: 210, date: "2011-07-22", type: "track"},
        {file: "aachen_86", index:3, energy: 300, date: "2011-12-01", type: "track"},
        {file: "aachen_86", index:4, energy: 660, date: "2011-12-16", type: "track"},
        {file: "aachen_86", index:5, energy: 200, date: "2012-05-15", type: "track"},
        {file: "aachen_86", index:6, energy: 260, date: "2012-08-07", type: "track"},
        {file: "aachen_86", index:7, energy: 210, date: "2012-10-11", type: "track"},
        {file: "aachen_86", index:8, energy: 750, date: "2012-10-26", type: "track"},
        {file: "aachen_86", index:9, energy: 670, date: "2013-06-27", type: "track"},
        {file: "aachen_86", index:10, energy: 400, date: "2013-08-17", type: "track"},
        {file: "aachen_86", index:11, energy: 390, date: "2013-10-14", type: "track"},
        {file: "aachen_86", index:12, energy: 850, date: "2014-01-09", type: "track"},
        {file: "aachen_86", index:13, energy: 400, date: "2014-05-22", type: "track"},
        {file: "aachen_86", index:14, energy: 340, date: "2014-06-09", type: "track"},
        {file: "aachen_86", index:15, energy: 4450, date: "2014-06-11", type: "track"},
        {file: "aachen_86", index:17, energy: 210, date: "2015-01-27", type: "track"},
        {file: "aachen_86", index:18, energy: 240, date: "2015-05-15", type: "track"},
    ];
    var events_mapping = {};
    for (var i=0;i<events.length;i++){
        events_mapping[events[i].file+'_'+events[i].index] = events[i];
    }
    var types = {
        track: "track-like event",
        cascade: "cascade event",
//        coincident: "coincident event"
    };

    var min_date="3000-00-00", max_date="1900-00-00", min_energy=10000, max_energy=0;
    for (var i=0;i<events.length;i++) {
        events[i].selected = 1;
        if (events[i].date < min_date)
            min_date = events[i].date;
        if (events[i].date > max_date)
            max_date = events[i].date;
        if (events[i].energy >= 0 && events[i].energy < min_energy)
            min_energy = events[i].energy;
        if (events[i].energy > max_energy)
            max_energy = events[i].energy;
    }

    var make_selection = function(start_date, end_date, start_energy, end_energy, types){
        //console.log('make_selection');
        //console.log('date: '+start_date+' '+end_date);
        //console.log('energy: '+start_energy+' '+end_energy);
        //console.log(types);
        for (var i=0;i<events.length;i++) {
            var e = $(element).find('.he_neutrinos-preview-body .'+events[i].file+'_'+events[i].index);
            //console.log('date: '+events[i].date+' energy: '+events[i].energy+' type: '+events[i].type);
            var select = true;
            if (events[i].date < start_date || events[i].date > end_date) {
                select = false;
            }
            if (events[i].energy > 0 && (events[i].energy < start_energy || events[i].energy > end_energy)) {
                select = false;
            }
            if (types[events[i].type] == 0) {
                select = false;
            }
            if (select) {
                events[i].selected = 1;
                if (!e.hasClass('selected'))
                    e.addClass('selected');
            } else {
                events[i].selected = 0;
                if (e.hasClass('selected'))
                    e.removeClass('selected');
            }
        }
    };

    // make layout
    (function(){
        var cur_min_date = min_date, cur_max_date = max_date;
        var cur_min_energy = min_energy, cur_max_energy = max_energy;
        var cur_types = {};
        for (var t in types) {
            cur_types[t] = 1;
        }
        //cur_types.coincident = 0;

        var html = '<div class="he_neutrinos-filter active">';
        html += '  <h4 class="he_neutrinos-filter-header">Filter Events</h4>';
        html += '  <h5 class="he_neutrinos-filter-type-header">By Date:</h5>';
        html += '  <div class="he_neutrinos-filter-date">';
        html += '    <div class="slider"></div>';
        html += '    <input type="text" readonly class="slider-value" />';
        html += '  </div>';
        html += '  <h5 class="he_neutrinos-filter-type-header">By Energy:</h5>';
        html += '  <div class="he_neutrinos-filter-energy">';
        html += '    <div class="slider"></div>';
        html += '    <input type="text" readonly class="slider-value" />';
        html += '  </div>';
        html += '  <h5 class="he_neutrinos-filter-type-header">By Type:</h5>';
        html += '  <div class="he_neutrinos-filter-type">';
        for (var t in cur_types) {
            html += '<div class="he_neutrinos-filter-type-option';
            if (cur_types[t] != 0)
                html += ' selected';
            html += '" value="'+t+'">'+types[t]+'</div>';
        }
        html += '  </div>';
        html += '</div>';
        html += '<div class="he_neutrinos-preview active">';
        html += '  <h4 class="he_neutrinos-preview-header">Event Selection</h4>';
        html += '  <p class="he_neutrinos-preview-subheader">Click on the images to open an interactive display of each event.</p>';
        html += '  <div class="he_neutrinos-preview-body">';
        for (var i=0;i<events.length;i++) {
            var e = events[i];
            html += '<div class="he_neutrinos-preview-event-wrapper ';
            if (e.selected == 1)
                html += 'selected ';
            html += e.file+'_'+e.index+'">';
            //html += '  <div class="name">'+e.file+' '+e.index+'</div>';
            html += '  <div class="date">'+e.date+'</div>';
            html += '  <div class="event" file="'+e.file+'" index="'+e.index+'">';
            html += '    <img src="'+domain+'/static/he_neutrinos/'+e.file+'_'+e.index+'.png"';
            html += '     width=200 height=200 /></div>';
            html += '  <div class="energy">'
            if (e.energy > 0)
                html += e.energy+' TeV';
            else
                html += '&nbsp;';
            html += '  </div>';
            html += '</div>';
        }
        html += '  </div>';
        html += '</div>';
        html += '<div class="viewer-overlay">';
        html += '  <div class="viewer-header"></div>';
        html += '  <div id="he_neutrinos-viewer"></div>';
        html += '</div>';
        $(element).html(html);
        
        make_selection(cur_min_date, cur_max_date, cur_min_energy,
                       cur_max_energy, cur_types);

        var date_diff = (new Date(max_date) - new Date(min_date))/1000/3600/24;
        var pad = function(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        };
        var toDate = function(days) {
            var d = new Date(min_date);
            d.setDate(d.getDate() + days);
            return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());
        };
        $('.he_neutrinos-filter-date .slider').slider({
            range: true,
            min: 0,
            max: date_diff,
            values: [ 0, date_diff ],
            slide: function( event, ui ) {
                cur_min_date = toDate(ui.values[0]);
                cur_max_date = toDate(ui.values[1]);
                $('.he_neutrinos-filter-date .slider-value').val( cur_min_date + ' - ' + cur_max_date );
                make_selection(cur_min_date, cur_max_date, cur_min_energy,
                               cur_max_energy, cur_types);
            }
        });
        $('.he_neutrinos-filter-date .slider-value').val( min_date + ' - ' + max_date );
        //$('.he_neutrinos-filter-date .slider .ui-slider-handle').draggable({axis:"x", containment: "parent"}).css('position','absolute');

        $('.he_neutrinos-filter-energy .slider').slider({
            range: true,
            min: cur_min_energy,
            max: cur_max_energy,
            values: [ min_energy, max_energy ],
            slide: function( event, ui ) {
                cur_min_energy = ui.values[0];
                cur_max_energy = ui.values[1];
                $('.he_neutrinos-filter-energy .slider-value').val( cur_min_energy +
                  ' - ' + cur_max_energy + ' TeV' );
                make_selection(cur_min_date, cur_max_date, cur_min_energy,
                               cur_max_energy, cur_types);
            }
        });
        $('.he_neutrinos-filter-energy .slider-value').val( $('.he_neutrinos-filter-energy .slider').slider( "values", 0 ) +
          " - " + $('.he_neutrinos-filter-energy .slider').slider( "values", 1 ) + ' TeV' );

        $(element).on('click','.he_neutrinos-filter-type-option',function(){
            var t = $(this).attr('value');
            if (t in cur_types) {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    cur_types[t] = 0;
                } else {
                    $(this).addClass('selected');
                    cur_types[t] = 1;
                }
                make_selection(cur_min_date, cur_max_date, cur_min_energy,
                               cur_max_energy, cur_types);
            }
        });

        $('#he_neutrinos-viewer').on('click',false);
        $(element).on('click', '.he_neutrinos-preview-event-wrapper .event', function(){
            var file = $(this).attr('file');
            var index = parseInt($(this).attr('index'));
            console.log('view: '+file+'_'+index);
            var e = events_mapping[file+'_'+index];
            var gcd = files[file].gcdret;
            var data = files[file].dataret[index];
            $('.viewer-overlay').addClass('active');
            history.pushState(null, null, '#'+file+'_'+index);
            window.onpopstate = function(event) {
                $('.viewer-overlay').removeClass('active');
                window.onpopstate = null;
            };
            $('.viewer-overlay').on('click',function(){
                $('.viewer-overlay').removeClass('active');
                history.pushState(null, null, '#');
                window.onpopstate = null;
            })
            var tab = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            var html = '<h4><span style="text-transform:uppercase">'+file+'</span> Event '+index+'</h4>';
            html += '<h5>Date: '+e.date+tab+'Energy: '+e.energy+' TeV'+tab+'Type: ';
            html += '<span style="text-transform:capitalize">'+types[e.type]+'</span></h5>';
            $('.viewer-overlay>.viewer-header').html(html);
            viewer_wrapper({domain:domain,
                            element:'#he_neutrinos-viewer',
                            raw_viewer:true,
                            randomize:false,
                            loop:false,
                            smart_color:true,
                            gcdframe:gcd,
                            dataframes:[data],
                            active_artists:{},
                            preferred_pulseseries:files[file].datakeys,
                            loader_callback:function(state,methods){
                                methods.draw_frame();
                            }
            });
        });
    })();

    // function for after data is fully loaded
    var loaded = function(options,methods){
        console.log('loaded');
    };
    // make a pure loader with no display
    viewer_wrapper({domain:domain,
                    no_viewer:true,
                    element:'#he_neutrinos-viewer',
                    randomize:false,
                    loop:false,
                    files:viewer_files,
                    loader_callback:loaded
    });
};

