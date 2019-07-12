var to_csv = new csvWriter(',','');

VIEWER.Artists.recopulse_csv = function(state,config) {
    if (state.frameno >= state.maxframes || !(state.pulseseries in state.frames[state.frameno])) {
        return;
    }
    log.info('recopulse_csv');
    if (config == undefined || !('handler' in config)) {
        log.warn('recopulse_csv not configured');
        return;
    }
    if (to_csv == undefined) {
        log.error("csvWriter() is undefined");
        return;
    }
    var pulses = state.frames[state.frameno][state.pulseseries];
    var handler = config.handler;
    var doms = [['time','x','y','z']];
    var hits = {};

    for (var dom in pulses) {
        for (var i=0;i<pulses[dom]['data'].length;i++) {
            if (i > 0)
                break;
            var time = pulses[dom]['data'][i]['time'];
            var charge = pulses[dom]['data'][i]['charge'];
            var pmt = pulses[dom]['pmt'];
            var om = pulses[dom]['om'];
            var string = pulses[dom]['string'];
            var pos = state.geometry[string][om][pmt]['pos'];
            var pos_str = ""+pos.x+","+pos.y+","+pos.z;
            if (charge <= 0 || pos_str in hits)
                continue;
            hits[pos_str] = time;
            doms.push([time,pos.x,pos.y,pos.z]);
        }
    }
    var csv = to_csv.arrayToCSV(doms);
    if (handler != undefined) {
        handler(csv);
    } else {
        log.warn('recopulse_csv - error with handler');
    }
};
