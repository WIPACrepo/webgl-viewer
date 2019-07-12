VIEWER.Artists.coordinates = function(state,config) {
    log.info('coordinates');

    if (!('enable' in config))
        config.enable = true;
    if ('handler' in config) {
        var ret = config.handler();
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

    var scale = 'scale' in config?config.scale:150;
    var linewidth = 'linewidth' in config?config.linewidth:3;
    var x_color = 'x_color' in config?config.x_color:0x0000CC;
    var y_color = 'y_color' in config?config.y_color:0x00CC00;
    var z_color = 'z_color' in config?config.z_color:0xCC0000;
    var cone_geometry = new THREE.CylinderGeometry( 0, linewidth*5, linewidth*10, 32 );

    var bottom = -500;

    var x_line_geo = new THREE.Geometry();
    x_line_geo.vertices.push(new THREE.Vector3(0,0,bottom));
    x_line_geo.vertices.push(new THREE.Vector3(scale,0,bottom));
    var x_line = new THREE.Line(x_line_geo,
        new THREE.LineBasicMaterial({
            color: x_color,
            linewidth: linewidth,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            transparent: true
        })
    );
    config.scene_items.push(x_line);
    state.scene.add(x_line);

    var x_cone = new THREE.Mesh(
        cone_geometry,
        new THREE.MeshBasicMaterial( {color: x_color})
    );
    x_cone.rotation.x = Math.PI / 2;
    x_cone.rotation.z = -1 * Math.PI / 2;
    x_cone.position.set(scale,0,bottom);
    config.scene_items.push(x_cone);
    state.scene.add(x_cone);

    var y_line_geo = new THREE.Geometry();
    y_line_geo.vertices.push(new THREE.Vector3(0,0,bottom));
    y_line_geo.vertices.push(new THREE.Vector3(0,scale,bottom));
    var y_line = new THREE.Line(y_line_geo,
        new THREE.LineBasicMaterial({
            color: y_color,
            linewidth: linewidth,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            transparent: true
        })
    );
    config.scene_items.push(y_line);
    state.scene.add(y_line);

    var y_cone = new THREE.Mesh(
        cone_geometry,
        new THREE.MeshBasicMaterial( {color: y_color})
    );
    y_cone.rotation.y = Math.PI / 2;
    y_cone.position.set(0,scale,bottom);
    config.scene_items.push(y_cone);
    state.scene.add(y_cone);

    var z_line_geo = new THREE.Geometry();
    z_line_geo.vertices.push(new THREE.Vector3(0,0,bottom));
    z_line_geo.vertices.push(new THREE.Vector3(0,0,scale+bottom));
    var z_line = new THREE.Line(z_line_geo,
        new THREE.LineBasicMaterial({
            color: z_color,
            linewidth: linewidth,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            transparent: true
        })
    );
    config.scene_items.push(z_line);
    state.scene.add(z_line);

    var z_cone = new THREE.Mesh(
        cone_geometry,
        new THREE.MeshBasicMaterial( {color: z_color})
    );
    z_cone.rotation.x = Math.PI / 2;
    z_cone.position.set(0,0,scale+bottom);
    config.scene_items.push(z_cone);
    state.scene.add(z_cone);
};
