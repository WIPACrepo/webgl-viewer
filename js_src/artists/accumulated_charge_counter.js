VIEWER.Artists.accumulated_charge_counter = function(state) {
    if (state.frameno >= state.maxframes || !(state.pulseseries in state.frames[state.frameno])) {
        return;
    }
    log.info('accumulated_charge_counter');
    var cur_time = state.current_time;
    var pulses = state.frames[state.frameno][state.pulseseries];
    var element = $(state.element).find('div.drawing').first();
    var accumulated_charge = 0.0;

    for (var dom in pulses) {
        for (var i=0;i<pulses[dom]['data'].length;i++) {
            var time = pulses[dom]['data'][i]['time'];
            var charge = pulses[dom]['data'][i]['charge'];
            if (charge <= 0 || time > cur_time)
                continue;
            accumulated_charge += charge;
        }
    }
    
    var num = (Math.round(accumulated_charge*100)/100)+'';
    if (num.indexOf('.') < 0)
        num += '.00'
    else
        while (num.substr(num.indexOf('.')+1).length < 2) { num += '0'; }
    var text = 'Accumulated Charge: '+num+'pe';
    if ($(element).children('.artist.accumulated_charge').length > 0) {
        $(element).children('.artist.accumulated_charge').text(text);
    } else {
        var html = '<div class="artist accumulated_charge">'+text+'</div>';
        $(element).prepend(html);
    }
};

VIEWER.Artists.accumulated_charge_counter_small = function(state) {
    if (state.frameno >= state.maxframes || !(state.pulseseries in state.frames[state.frameno])) {
        return;
    }
    log.info('accumulated_charge_counter_small');
    var cur_time = state.current_time;
    var pulses = state.frames[state.frameno][state.pulseseries];
    var element = $(state.element).find('div.drawing').first();
    var accumulated_charge = 0.0;

    for (var dom in pulses) {
        for (var i=0;i<pulses[dom]['data'].length;i++) {
            var time = pulses[dom]['data'][i]['time'];
            var charge = pulses[dom]['data'][i]['charge'];
            if (charge <= 0 || time > cur_time)
                continue;
            accumulated_charge += charge;
        }
    }
    
    var num = (Math.round(accumulated_charge))+'';
    var text = num+'pe';
    if ($(element).children('.artist.accumulated_charge').length > 0) {
        $(element).children('.artist.accumulated_charge').text(text);
    } else {
        var html = '<div class="artist accumulated_charge">'+text+'</div>';
        $(element).prepend(html);
    }
};
