VIEWER.Artists.last_dom = function(state,config) {
    if (state.frameno >= state.maxframes || !(state.pulseseries in state.frames[state.frameno])) {
        return;
    }
    log.info('last_dom');
    if (config == undefined || !('handler' in config)) {
        log.warn('last_dom not configured');
        return;
    }
    var cur_time = state.current_time;
    var pulses = state.frames[state.frameno][state.pulseseries];
    var handler = config.handler;
    var last_dom = [], last_time = 0.0;

    for (var dom in pulses) {
        for (var i=0;i<pulses[dom]['data'].length;i++) {
            if (i > 0)
                break;
            var time = pulses[dom]['data'][i]['time'];
            var charge = pulses[dom]['data'][i]['charge'];
            var pmt = pulses[dom]['pmt'];
            var om = pulses[dom]['om'];
            var string = pulses[dom]['string'];
            if (charge <= 0 || time > cur_time || time < last_time)
                continue;
            last_time = time;
            last_dom = [string,om,pmt];
        }
    }
    if (last_time < 0.1)
        return;
    log.info('time = '+last_time+' last_dom = '+JSON.stringify(last_dom));
    var pos = state.geometry[last_dom[0]][last_dom[1]][last_dom[2]]['pos'];
    if (handler != undefined && pos != undefined) {
        log.info('time = '+last_time+' pos = '+JSON.stringify(pos));
        var ret = handler(pos.x,pos.y,pos.z,last_time);
        if (ret != undefined && ret != null && ret == false)
            config.highlight = false;
        else if (ret == true)
            config.highlight = true;
    } else {
        log.warn('last_dom - error with handler or pos');
    }

    if (config.particlesystem != null && config.particlesystem != undefined) {
        // remove previous hits
        state.scene.remove( config.particlesystem );
        delete config.particlesystem;
    }
    if (config.highlight == true) {
        // highlight the last dom
        var hits = new THREE.Geometry();
        hits.vertices.push(new THREE.Vector3(pos.x,pos.y,pos.z));
        var attributes = {
            size: { type: 'f', value: [100] },
            customColor: { type: 'c', value: [new THREE.Color( 0xFF1CDE )] }
        };
        if (state.webgl == true) {
            if (config.particlesystem != null && config.particlesystem != undefined) {
                // remove previous hits
                state.scene.remove( config.particlesystem );
                delete config.particlesystem;
            }
            config.particlesystem = new THREE.PointCloud( hits, state.particlesphere_material(attributes) );
        } else {
            config.particlesystem = new THREE.Object3D();
            var dom = null;
            var attr = null;
            for (var i = 0;i < hits.vertices.length;i++) {
                attr = {
                    size: attributes.size.value[0],
                    customColor: attributes.customColor.value[0]
                };
                dom = new THREE.Particle( state.particlesphere_material(attr) );
                dom.position.set(hits.vertices[i].x,hits.vertices[i].y,hits.vertices[i].z);
                config.particlesystem.add(dom);
            }
        }
        state.scene.add( config.particlesystem );
    }
};
