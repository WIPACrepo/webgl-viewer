VIEWER.Artists.linefit = function(state,config) {
    log.info('linefit');

    var p = null;
    var frameobj = 'frameobj' in config?config.frameobj:['MPEFit','SPEFit','LineFit'];
    if (Array.isArray(frameobj)) {
        for (var i=0;i<frameobj.length;i++) {
            p = state.frames[state.frameno][frameobj[i]];
            if (p != null && p != undefined)
                break;
        }
    } else {
        p = state.frames[state.frameno][frameobj];
    }
    if (p == null || p == undefined) {
        log.error('cannot find frame object '+frameobj);
        return;
    }

    if (!('enable' in config))
        config.enable = true;
    if ('handler' in config) {
        var ret = config.handler(p);
        if (ret != undefined && ret != null && ret == false)
            config.enable = false;
        else if (ret == true)
            config.enable = true;
    }

    if (config.scene_items != null && config.scene_items != undefined) {
        for (var i=config.scene_items.length-1;i>=0;i--) {
            state.scene.remove(config.scene_items[i]);
        }
        delete config.scene_items;
    }
    config.scene_items = [];

    if (!config.enable)
        return;
    var time = state.begin;
    if (time > state.current_time) {
        log.info("not yet time for the line");
        return;
    }

    var scale = 'scale' in config?config.scale:1000;
    var linewidth = 'linewidth' in config?config.linewidth:3;
    var color = 'color' in config?config.color:0x000099;
    var cone_geometry = new THREE.CylinderGeometry( 0, linewidth*5, linewidth*10, 32 );
    var back_time = state.begin-p.time;
    var forward_time = state.current_time-p.time;
    log.info('back'+back_time);
    log.info('forwards'+forward_time);

    var line_geo = new THREE.Geometry();
    line_geo.vertices.push(new THREE.Vector3(
            p.pos.x-p.dir.x*scale,
            p.pos.y-p.dir.y*scale,
            p.pos.z-p.dir.z*scale
    ));
    line_geo.vertices.push(new THREE.Vector3(
            p.pos.x+p.dir.x*back_time,
            p.pos.y+p.dir.y*back_time,
            p.pos.z+p.dir.z*back_time
    ));
    line_geo.vertices.push(new THREE.Vector3(
            p.pos.x+p.dir.x*forward_time*p.speed,
            p.pos.y+p.dir.y*forward_time*p.speed,
            p.pos.z+p.dir.z*forward_time*p.speed
    ));
    var line = new THREE.Line(line_geo,
        new THREE.LineBasicMaterial({
            color: color,
            linewidth: linewidth,
            //opacity: 1,
            //blending: THREE.AdditiveBlending,
            //transparent: true
        })
    );
    config.scene_items.push(line);
    state.scene.add(line);

    /*var cone = new THREE.Mesh(
        cone_geometry,
        new THREE.MeshBasicMaterial( {color: color})
    );
    //cone.rotation.x += Math.PI / 2 * p.dir.x;
    //cone.rotation.z += -1 * Math.PI / 2;
    cone.rotation.y += Math.PI / 2 * p.dir.y;
    cone.rotation.x += Math.PI / 2 * p.dir.z;
    cone.position.set(line_geo.vertices[2].x,line_geo.vertices[2].y,line_geo.vertices[2].z);
    config.scene_items.push(cone);
    state.scene.add(cone);*/
};
