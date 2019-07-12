/*!
 * WebGL IceCube Viewer
 *
 * Copyright 2012, IceCube Collaboration
 */

var debug = false;
var domain = '';

var log = logging('info');
setDomain = function ( d ) { domain = d; };

viewerAjaxCaller = function( url, data, success_cb, error_cb ){
    log.debug('ajaxCaller - url='+url);
    jQuery.ajax({url:url,
            //type:'POST',
            dataType:'jsonp',
            data:data,//JSON.stringify(data),
            //processData:false,
            cache:false
    }).fail(function(xhr,error,errorThrown){
        if (error_cb != undefined) {
            error_cb(error)
        } else {
            alert('error: '+error+'  - '+errorThrown);
        }
    }).done(function(data,textStatus,xhr){
        success_cb(json_decode_helper(data));
    });
};

var VIEWER = { REVISION: '4', Artists: { } };

var viewer = function( $ ) {

    var private_methods = {
        setup_renderer : function( state, callback ) {
            var screen_canvas = $(state.element).find('canvas').first();
            state.width = $(screen_canvas).width();
            state.height = $(screen_canvas).height();

            // setup scene basics
            state.scene = new THREE.Scene();
            state.camera = new THREE.PerspectiveCamera( 75, state.width/state.height, 0.1, 100000 );
            state.scene.add( state.camera );
            state.camera.up = new THREE.Vector3(0,0,1);

            log.info('canvas width:'+state.width+' height:'+state.height);
            if (state.webgl === false || !Detector.webgl) {
                // attempt degraded canvas support
                if (!Detector.canvas) {
                    return false;
                }
                try {
                    state.renderer = new THREE.CanvasRenderer({canvas: screen_canvas.get(0)});
                } catch (error) {
                    log.warn('cannot create canvas renderer');
                    log.info(error);
                    return false;
                }
                state.webgl = false;
                log.info('canvas renderer');
            } else {
                try {
                    state.renderer = new THREE.WebGLRenderer({
                        antialias: true,
                        canvas: screen_canvas.get(0),
                        preserveDrawingBuffer: (state.allow_screenshot?true:false)
                    });
                } catch (error) {
                    log.warn('cannot create webgl renderer');
                    log.info(error);
                    state.webgl = false;
                    // replace the canvas to remove any webgl attachments to it
                    $(screen_canvas).after('<canvas width="'+state.width+'" height="'+state.height+'">Sorry, this viewer requires a web browser which supports HTML5 canvas!</canvas>').remove();
                    return private_methods.setup_renderer(state,callback);
                }
                if (state.renderer === undefined || !state.renderer.getContext()
                    || state.renderer.capabilities === undefined
                    || state.renderer.extensions === undefined
                    || !state.renderer.extensions.get('EXT_frag_depth')) {
                    log.warn('webgl renderer not all there');
                    state.webgl = false;
                    // replace the canvas to remove any webgl attachments to it
                    $(screen_canvas).after('<canvas width="'+state.width+'" height="'+state.height+'">Sorry, this viewer requires a web browser which supports HTML5 canvas!</canvas>').remove();
                    return private_methods.setup_renderer(state,callback);
                }
                state.webgl = true;
                log.info('webgl renderer');
            }
            state.renderer.setPixelRatio( window.devicePixelRatio );
            state.renderer.setSize( state.width, state.height );
            if (state.high_contrast) {
                state.renderer.setClearColor(0x111111,1);
                $(screen_canvas).css('background-color','#111');
            } else {
                state.renderer.setClearColor(0x262626,1);
                $(screen_canvas).css('background-color','#262626');
            }

            // make particle sphere shader
            if (state.webgl == true) {
                state.particlesphere_material = function(attributes) {
                    return new THREE.ShaderMaterial( {
                        uniforms: {
                        },
                        vertexShader: [
                            'attribute vec3 color;',
                            'attribute float size;',
                            'varying float radius;',
                            'varying vec3 vColor;',
                            'varying vec3 cameraSphereVertex;',
                            'void main()',
                            '{',
                            '    radius = size;',
                            '    vColor = color;',
                            '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
                            '    gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );',
                            '    gl_Position = projectionMatrix * mvPosition;',
                            '    cameraSphereVertex = vec3(mvPosition);',
                            '}'
                        ].join('\n'),
                        fragmentShader: [
                            //'#extension GL_EXT_frag_depth : enable',
                            'uniform mat4 projectionMatrix;',
                            'varying float radius;',
                            'varying vec3 vColor;',
                            'varying vec3 cameraSphereVertex;',
                            'void main()',
                            '{',
                            '    if (radius <= 0.1) discard;',
                            '    vec4 tmp_color = vec4( vColor, 1.0 );',
                            '    vec2 coord = gl_PointCoord * 2.0 - 1.0;',
                            '    float lensq = dot( coord, coord );',
                            '    float len = sqrt(lensq);',
                            '    if (len > 1.0) discard;',
                                 // normal and position of this fragment in camera coords
                            '    vec3 cameraNormal = vec3( coord, sqrt( 1.0-lensq ) );',
                            '    vec3 cameraPos = ( radius * cameraNormal )+ cameraSphereVertex;',
                                 // compute fragment depth, if possible
                            '#ifdef GL_EXT_frag_depth',
                            '    vec4 clipPos = projectionMatrix * vec4(cameraPos,1.0);',
                            '    float ndcDepth = clipPos.z / clipPos.w;',
                            '    gl_FragDepthEXT = ((gl_DepthRange.diff * ndcDepth) + gl_DepthRange.near + gl_DepthRange.far) * 0.5;',
                            '#endif',
                                 // calculate lighting
                            '    vec3 light = vec3(0.0,0.0,0.0);',
                            '    vec3 n = cameraNormal;',
                            '    vec3 V = cameraPos;',
                            '    vec3 L = normalize( light-V );',
                            '    vec4 outcolor = vec4( 0.0, 0.0, 0.0, 1.0);',
                                 // calculate Diffuse Term
                            '    vec4 Idiff = tmp_color * max(dot(n,L), 0.0);',
                            '    outcolor += clamp(Idiff, 0.0, 1.0);     ',
                            '    if (outcolor.a < 0.15) discard;',
                            '    if (length(outcolor.rgb) < 0.15) discard;',
                                 // set fragment color
                            '    gl_FragColor = vec4(outcolor.rgb, tmp_color.a);',
                            '}'
                        ].join('\n'),
                        blending: THREE.CustomBlending,
                        blendEquation: THREE.AddEquation,
                        blendSrc: THREE.SrcAlphaFactor,
                        blendSrcAlpha: THREE.OneFactor,
                        blendDst: THREE.OneMinusSrcAlphaFactor,
                        extensions: {
                            fragDepth: true
                        },
                        depthTest: true,
                        depthWrite: true,
                        transparent: true
                    });
                };
            } else {
                state.particlesphere_material = function(attributes) {
                    var PI2 = Math.PI * 2;
                    var r = attributes.size*0.3; // scale the size compared to the webgl renderer
                    var color = attributes.color.clone();
                    if (r <= 8) {
                        // optimized drawing for small objects
                        color.multiplyScalar(0.75);
                        var c1 = decimalToHex(color.getHex());
                        var program = function ( context ) {
                            context.beginPath();
                            context.arc( 0, 0, r, 0, PI2, true );
                            context.fillStyle = c1;
                            context.fill();
                        }
                    } else {
                        var c1 = decimalToHex(color.getHex());
                        color.multiplyScalar(0.5);
                        var c2 = decimalToHex(color.getHex());
                        var r_neg = -1*r;
                        var r2 = 2*r;
                        var program = function ( context ) {
                            var radgrad = context.createRadialGradient(0,0,0,0,0,r);
                            radgrad.addColorStop(0, c1 );
                            radgrad.addColorStop(0.2, c1 );
                            radgrad.addColorStop(0.95, c2 );
                            radgrad.addColorStop(1, 'rgba(0,0,0,0)' );
                            context.fillStyle = radgrad;
                            context.fillRect(r_neg,r_neg,r2,r2);
                        }
                    }
                    return new THREE.SpriteCanvasMaterial( {
                        color: color,
                        program: program,
                        depthTest: false,
                        transparent: true
                    });
                };
            }
            if (callback != undefined) {
                var methods = {};
                for(var m in public_methods) {
                    methods[m] = partial(public_methods[m], state);
                }
                setTimeout(function(){
                    log.info('calling callback');
                    callback(methods);
                }, 100);
            }
        },
        draw : function( state ) {
            // cameraPos origin is at centerPos
            // do transform to global coords
            state.camera.position.set(
                state.cameraPos.x()+state.centerPos.x(),
                state.cameraPos.y()+state.centerPos.y(),
                state.cameraPos.z()+state.centerPos.z());
            state.camera.lookAt(new THREE.Vector3(
                state.centerPos.x(),
                state.centerPos.y(),
                state.centerPos.z()));
            if (state.webgl != true) {
                if (state.high_contrast) {
                    state.renderer.setClearColor(0x111111,1);
                } else {
                    state.renderer.setClearColor(0x262626,1);
                }
                state.renderer.clear();
            }
            try {
                var start = Date.now();
                state.renderer.render( state.scene, state.camera  );
                if (state.webgl != true && Date.now() - start < 10) {
                    log.warn('canvas_full = false');
                    state.canvas_full = false;
                }
            } catch (error) {
                log.error('render error '+error+' '+error.fileName+' '+error.lineNumber);
            }
        },
        rotate_viewer : function(state, offsetx, offsety) {
            // rotate camera around center
            state.cameraPos.phi(state.cameraPos.phi()+offsetx/state.width*Math.PI*2.0);
            //state.cameraPos.z(state.cameraPos.z()-offsety/state.height*2000);
            var newtheta = state.cameraPos.theta()-offsety/state.height*Math.PI;
            if (newtheta > Math.PI/2)
                newtheta = Math.PI/2;
            else if (newtheta < -1*Math.PI/2)
                newtheta = -1*Math.PI/2
            state.cameraPos.theta(newtheta)
        },
        translate_viewer : function(state, offsetx, offsety) {
            offsetx *= 2;
            offsety *= 2;
            // translate across viewing window
            var r = state.cameraPos.r();
            var phi = state.cameraPos.phi();
            var theta = state.cameraPos.theta();
            // get new pos
            var newr = Math.sqrt(offsetx*offsetx+offsety*offsety+r*r);
            var dphi = Math.atan(offsetx/r);
            var dtheta = -1*Math.atan(offsety/r);
            var newPos = new vector3d();
            newPos.r(newr);
            newPos.phi(phi+dphi);
            newPos.theta(theta+dtheta);
            // get new center pos
            var dx = newPos.x()-state.cameraPos.x();
            var dy = newPos.y()-state.cameraPos.y();
            var dz = newPos.z()-state.cameraPos.z();
            state.centerPos.x(state.centerPos.x()+dx);
            state.centerPos.y(state.centerPos.y()+dy);
            state.centerPos.z(state.centerPos.z()+dz);
        },
        add_strings : function(state){
            // draw strings using GCD geo data
            var geo = state.geometry;
            if (geo == undefined) {
                log.error('no geometry loaded. cannot draw strings');
                return;
            }

            var nPMTs = 0;
            for (var s in geo) {
                for (var d in geo[s]) {
                    for (var p in geo[s][d]) {
                        nPMTs += 1;
                    }
                }
            }
            console.log('nPMTs: '+nPMTs);
            var positions = new Float32Array(nPMTs*3);
            var colors = new Float32Array(nPMTs*3);
            var sizes = new Float32Array(nPMTs);

            var prevPoint = null;
            if (state.string_lines != null && state.string_lines != undefined) {
                for (var i=state.string_lines.length-1;i>=0;i--) {
                    state.scene.remove(state.string_lines[i]);
                }
                delete state.string_lines;
            }
            state.string_lines = [];
            log.info('show_fiducial:'+state.show_fiducial);
            var curPMT = 0;
            for (var s in geo) {
                var doms = geo[s];
                var fiducial_line = 0;
                var dom_top = null;
                var dom_bottom = null;
                for (var d in doms) {
                    var pmts = doms[d];
                    for (var p in pmts) {
                        var pmt = pmts[p];
                        var pos = pmt['pos'];
                        // default dom color/size
                        var color = new THREE.Color( 0xC3C3C3 );
                        var size = 5;
                        if (pmt['type'] == 1) {
                            // icecube dom
                            if (dom_top == null || dom_top.z < pos.z)
                                dom_top = pos;
                            if (dom_bottom == null || dom_bottom.z > pos.z)
                                dom_bottom = pos;
                            if (state.show_fiducial && !(pmt['fiducial'] === true)) {
                                fiducial_line += 1;
                                color = new THREE.Color( 0xFF1CDE );
                                size = 7;
                            } else if (state.webgl == false && state.canvas_full == false) {
                                size = 0; // faster drawing on canvas
                            }
                        } else if (pmt['type'] == 2) {
                            // icetop dom
                            color = new THREE.Color( 0xFCFCFC );
                            size = 8;
                        }
                        var curPMT3 = curPMT * 3;
                        positions[curPMT3] = pos.x;
                        positions[curPMT3+1] = pos.y;
                        positions[curPMT3+2] = pos.z;
                        colors[curPMT3] = color.r;
                        colors[curPMT3+1] = color.g;
                        colors[curPMT3+2] = color.b;
                        sizes[curPMT] = size;
                        curPMT += 1;
                    }
                }
                var line = new THREE.Geometry();
                if (dom_top != null && dom_bottom != null) {
                    line.vertices.push(new THREE.Vector3(dom_top.x,dom_top.y,dom_top.z));
                    line.vertices.push(new THREE.Vector3(dom_bottom.x,dom_bottom.y,dom_bottom.z));
                }
                // draw line
                if (line.vertices.length > 0) {
                    if (state.webgl == true) {
                        var l = new THREE.Line(line,new THREE.LineBasicMaterial({color:0x606060,linewidth:1,opacity: 0.8,transparent: true}));
                    } else {
                        var color = (fiducial_line > 15 && state.canvas_full != true)?0xFF1CDE:0x909090;
                        var l = new THREE.Line(line,new THREE.LineBasicMaterial({color:color,linewidth:0.4,opacity: 1, blending: THREE.AdditiveBlending, transparent: true}));
                    }
                    state.string_lines.push(l);
                    state.scene.add(l);
                }
            }
            if (state.pmtSystem != null && state.pmtSystem != undefined) {
                // remove previous hits
                state.scene.remove( state.pmtSystem );
                delete state.pmtSystem;
            }
            if (state.webgl == true) {
                var disposeArray = function() { this.array = null; }
                var geo = new THREE.BufferGeometry();
                geo.addAttribute( 'position',
                    new THREE.BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
                geo.addAttribute( 'color',
                    new THREE.BufferAttribute( colors, 3 ).onUpload( disposeArray ) );
                geo.addAttribute( 'size',
                    new THREE.BufferAttribute( sizes, 1 ).onUpload( disposeArray ) );
                state.pmtSystem = new THREE.Points( geo, state.particlesphere_material({}) );
            } else {
                state.pmtSystem = new THREE.Group();
                var particle = null;
                var attr = null;
                for (var i = 0;i < nPMTs;i++) {
                    if (sizes[i] < 1)
                        continue;
                    var i3 = i*3;
                    attr = {
                        size: sizes[i],
                        color: new THREE.Color(colors[i3], colors[i3+1], colors[i3+2])
                    };
                    particle = new THREE.Sprite( state.particlesphere_material(attr) );
                    particle.position.set(positions[i3],positions[i3+1],positions[i3+2]);
                    state.pmtSystem.add(particle);
                }
            }
            state.scene.add( state.pmtSystem );
        },
        add_recopulses : function(state) {
            if (state.frameno >= state.maxframes || !(state.pulseseries in state.frames[state.frameno])) {
                log.warn('no frames or no pulseseries to show');
                log.info('state.frameno: '+state.frameno);
                log.info('state.maxframes: '+state.maxframes);
                log.info('state.frames.length: '+state.frames.length);
                return;
            }
            var frame = state.frames[state.frameno][state.pulseseries];
            var finaltime = state.current_time;
            log.info('add_recopulses');
            log.debug('start time: '+state.begin);
            log.debug('end time: '+state.end);
            log.debug('finaltime: '+finaltime);

            var nHits = frame.length;
            console.log('nHits: '+nHits);
            var positions = new Float32Array(nHits*3);
            var colors = new Float32Array(nHits*3);
            var sizes = new Float32Array(nHits);

            for (var dom=0;dom<nHits;dom++) {
                //log.debug('got dom '+JSON.stringify(frame[dom]))
                var pmt = frame[dom]['pmt'];
                var om = frame[dom]['om'];
                var string = frame[dom]['string'];
                var time = 0;
                var charge = 0;
                for (var i=0;i<frame[dom]['data'].length;i++) {
                    if (time == 0)
                        time = frame[dom]['data'][i]['time'];
                    if (frame[dom]['data'][i]['time'] > finaltime)
                        continue;
                    charge += frame[dom]['data'][i]['charge'];
                }
                //log.debug('pos = '+string+' '+om+' '+pmt+'    time='+time+' charge='+charge);

                // look up dom position
                try {
                    var pos = state.geometry[string][om][pmt]['pos'];
                } catch (error) {
                    log.warn('bad string '+string+'  om '+om);
                }
                log.debug('pos '+JSON.stringify(pos));
                var i3 = dom*3;
                positions[i3] = pos.x;
                positions[i3+1] = pos.y;
                positions[i3+2] = pos.z;
                // add color based on time
                var c = new THREE.Color( 0x0000FF );
                var ratio = 0;
                if (time > state.color_end)
                    ratio = 1;
                else if (time > state.color_begin)
                    ratio = (time-state.color_begin)/(state.color_end-state.color_begin)
                if (state.high_contrast)
                    c.setHSL(ratio*0.6666,1,0.5);
                else
                    c.setHSL(ratio*0.6666,1,0.5);
                colors[i3] = c.r;
                colors[i3+1] = c.g;
                colors[i3+2] = c.b;
                // add size based on charge
                if (charge <= 0) {
                    sizes[dom] = 0;
                } else {
                    var hitsize = Math.log(charge*10)/Math.LN10*25;
                    if (hitsize < 1)
                        hitsize = 1
                    sizes[dom] = hitsize;
                }
            }

            if (state.hitSystem != null && state.hitSystem != undefined) {
                // remove previous hits
                state.scene.remove( state.hitSystem );
                delete state.hitSystem;
            }
            if (state.webgl == true) {
                var geo = new THREE.BufferGeometry();
                var disposeArray = function() { this.array = null; }
                geo.addAttribute( 'position',
                    new THREE.BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
                geo.addAttribute( 'color',
                    new THREE.BufferAttribute( colors, 3 ).onUpload( disposeArray ) );
                geo.addAttribute( 'size',
                    new THREE.BufferAttribute( sizes, 1 ).onUpload( disposeArray ) );
                state.hitSystem = new THREE.Points( geo, state.particlesphere_material({}) );
            } else {
                state.hitSystem = new THREE.Group();
                var particle = null;
                var attr = null;
                for (var i = 0;i < nHits;i++) {
                    var i3 = i*3;
                    attr = {
                        size: sizes[i],
                        color: new THREE.Color(colors[i3], colors[i3+1], colors[i3+2])
                    };
                    particle = new THREE.Sprite( state.particlesphere_material(attr) );
                    particle.position.set(positions[i3], positions[i3+1], positions[i3+2]);
                    state.hitSystem.add(particle);
                }
            }
            state.scene.add( state.hitSystem );
        },
        add_linefit : function (state, frame) {
            var line = new THREE.Geometry();
            var finaltime = state.current_time;
            log.debug('add LineFit')

            // get line definition
            var pos = frame['pos'];
            var dir = frame['dir'];
            var time = frame['time'];
            var speed = frame['speed'];
            var velocity = vector3d();
            log.debug('speed:'+speed+' begin:'+state.begin+' time:'+time+' curtime:'+finaltime);

            // find pos at begin
            velocity.x(dir.x);
            velocity.y(dir.y);
            velocity.z(dir.z);
            velocity.r(speed*(state.begin-time));
            var startingpos = {x:(pos.x+velocity.x()),
                               y:(pos.y+velocity.y()),
                               z:(pos.z+velocity.z())};

            // find pos at finaltime
            velocity.x(dir.x);
            velocity.y(dir.y);
            velocity.z(dir.z);
            velocity.r(speed*(finaltime-time));
            var endingpos = {x:(pos.x+velocity.x()),
                             y:(pos.y+velocity.y()),
                             z:(pos.z+velocity.z())};

            // extend line to infinity (almost)
            /*function bounded(pos,n) {
                if (pos.x < -1*n || pos.x > n ||
                    pos.y < -1*n || pos.y > n ||
                    pos.z < -1*n || pos.z > n)
                    return false;
                else
                    return true;
            }
            var negativepos = {x:pos.x,y:pos.y,z:pos.z};
            while (bounded(negativepos,10000)) {
                negativepos.x -= dir.x;
                negativepos.y -= dir.y;
                negativepos.z -= dir.z;
            }
            var positivepos = {x:pos.x,y:pos.y,z:pos.z};
            while (bounded(positivepos,10000)) {
                positivepos.x += dir.x;
                positivepos.y += dir.y;
                positivepos.z += dir.z;
            }*/
            log.debug('pos:'+JSON.stringify(pos)+' neg:'+JSON.stringify(startingpos)+' pos:'+JSON.stringify(endingpos))
            //line.vertices.push(new THREE.Vector3(negativepos.x,negativepos.y,negativepos.z));
            line.vertices.push(new THREE.Vector3(startingpos.x,startingpos.y,startingpos.z));
            line.vertices.push(new THREE.Vector3(endingpos.x,endingpos.y,endingpos.z));
            //line.vertices.push(new THREE.Vector3(positivepos.x,positivepos.y,positivepos.z));

            if (state.linefit != null && state.linefit != undefined) {
                // remove previous line
                state.scene.remove( state.linefit );
                delete state.linefit;
            }
            // draw line
            state.linefit = new THREE.Line(line,new THREE.LineBasicMaterial({color:0xff0000,linewidth:2}));
            state.scene.add(state.linefit);
        },
        compress_recopulses : function(state) {
            var frame = state.frames[state.frameno][state.pulseseries];
            log.info('compress_recopulses');
            log.debug('start time: '+state.begin);
            log.debug('end time: '+state.end);
            for (var dom=0;dom<frame.length;dom++) {
                //log.debug('got dom '+JSON.stringify(frame[dom]))
                if (frame[dom]['data'].length < 1)
                    continue;
                var time = -1;
                var charge = 0;
                for (var i=0;i<frame[dom]['data'].length;i++) {
                    if (time == -1 || frame[dom]['data'][i]['time'] < time)
                        time = frame[dom]['data'][i]['time'];
                    charge += frame[dom]['data'][i]['charge'];
                }
                if (charge <= 0) {
                    frame[dom]['data'] = [];
                }
                frame[dom]['data'] = [{time : time, charge : charge }];
            }
        },
        make_charge_hist : function(state) {
            if (state.frameno >= state.maxframes || !(state.pulseseries in state.frames[state.frameno])) {
                return;
            }
            var pulses = state.frames[state.frameno];
            var maxheight = 100;
            var maxwidth = 800;
            if (!state.raw_viewer) {
                var element = $(state.element).find('div.charge_hist').first();
                var maxheight = $(element).height();
                var maxwidth = $(element).width()-1;
            }
            var histogram = [];
            var color_histogram = [[],[]]; // start times and mode times
            for (var i=0;i<maxwidth;i++) {
                histogram[i] = 0;
                color_histogram[0][i] = 0;
                color_histogram[1][i] = 0;
            }
            var totcharge = 0

            var pulse = null;
            for (var dom=0;dom < pulses[state.pulseseries].length;dom++) {
                pulse = pulses[state.pulseseries][dom];
                var color_hist_tmp = [];
                var tmp_sum = 0;
                for (var i=0;i<maxwidth;i++) {
                    color_hist_tmp[i] = 0;
                }
                for (var i=0;i<pulse.data.length;i++) {
                    if (pulse.data[i].charge <= 0) {
                        continue;
                    }
                    var bin = 0;
                    if (pulse.data[i]['time'] >= state.end)
                        bin = maxwidth-1;
                    else if (pulse.data[i]['time'] > state.begin)
                        bin = Math.floor((pulse.data[i]['time']-state.begin)/(state.end-state.begin)*maxwidth);
                    //log.debug('time='+pulse.data[i]['time']+' charge='+pulse.data[i]['charge']+' bin='+bin);
                    histogram[bin] += pulse.data[i].charge;
                    color_hist_tmp[bin] += pulse.data[i].charge;
                    totcharge += pulse.data[i].charge;
                    tmp_sum += pulse.data[i].charge;
                }
                var color_bin = 0, color_n = 0, color_bin_first = -1;
                var color_bin_tmp = [];
                for (var i=0;i<maxwidth;i++) {
                    if (color_bin_first == -1 && color_hist_tmp[i] > 0)
                        color_bin_first = i;
                    for (var j=0;j<color_hist_tmp[i];j++) {
                        color_bin_tmp.push(i);
                        color_bin += i;
                        color_n += 1;
                    }
                }
                color_bin = mode(color_bin_tmp);//Math.floor(color_bin/color_n)
                color_histogram[0][color_bin_first] += tmp_sum;
                color_histogram[1][color_bin] += tmp_sum;
            }
            pulse = null;

            if (!state.force_color_times && state.smart_color) {
                // rebin into 10x less bins, skip low charge bins
                var bin10 = [[],[]],nbins = Math.floor(maxwidth/10);
                for (var i=0;i<nbins;i++) {
                    bin10[0][i] = 0;
                    bin10[1][i] = 0;
                }
                for (var i=0;i<maxwidth;i++) {
                    bin10[0][Math.floor(i/10)] += color_histogram[0][i];
                    bin10[1][Math.floor(i/10)] += color_histogram[1][i];
                }

                // take 25% in log charge cutoff
                var low = -1;
                var high = 0;
                var chargescale = Math.log(totcharge)/Math.log(10);
                var high_cutoff = 0.1;
                if (state.webgl != true && state.canvas_full != true) {
                    chargescale = Math.log(totcharge*5)/Math.log(10);
                    high_cutoff = 0.01;
                }
                for (var i=0;i<color_histogram[0].length;i++) {
                    if (bin10[0][Math.floor(i/10)] * nbins / totcharge > high_cutoff) {
                        if (Math.log(totcharge/color_histogram[0][i])/Math.log(10) < chargescale) {
                            high = i;
                        }
                    }
                    if (low == -1 && bin10[1][Math.floor(i/10)] * nbins / totcharge > 0.05) {
                        if (Math.log(totcharge/color_histogram[1][i])/Math.log(10) < Math.log(totcharge)/Math.log(10)*0.9) {
                            low = i;
                        }
                    }
                }
                if (low < 0)
                    low = 0;
                console.log('low: '+low+'  high: '+high);

                // take std deviations
                var low_deviations = 1.5, high_deviations = 1.5;
                if (state.webgl != true && state.canvas_full != true) {
                    high_deviations = 5.5;
                }
                var color_hist_avg = [];
                for (var i=0;i<maxwidth;i++) {
                    for (var j=0;j<histogram[i];j++) {
                        color_hist_avg.push(i);
                    }
                }
                var avg = average(color_hist_avg);
                var low_std = avg.mean-(low_deviations*avg.deviation), high_std = avg.mean+(high_deviations*avg.deviation);
                if (!isNaN(low_std) && low_std > low)
                    low = low_std;
                if (!isNaN(high_std) && high_std < high)
                    high = high_std;
                console.log('stddev low: '+low_std+'  high: '+high_std);

                // set color times
                if (low <= 0)
                    state.color_begin = state.begin;
                else
                    state.color_begin = Math.floor(low/maxwidth*(state.end-state.begin)+state.begin);
                if (high >= maxwidth-1)
                    state.color_end = state.end;
                else
                    state.color_end = Math.floor(high/maxwidth*(state.end-state.begin)+state.begin);
            }
            if (state.raw_viewer)
                return;

            //log.debug('current_bin: '+current_bin+'  max_bin:'+(maxwidth-1));
            var html = '';
            for (var i=0;i<maxwidth;i++) {
                var height = 0;
                if (histogram[i] > 0 && histogram[i] <= 1) {
                    height = 1;
                } else if (histogram[i] > 1) {
                    var x = Math.pow(histogram[i],.25);
                    height = Math.ceil((maxheight*x-(maxheight-1))/x);
                }
                html += '<div class="hist_data" style="height:'+height+'px"></div>';
                //log.debug('bin: '+i+' input: '+histogram[i]+' height:'+height);
            }
            html += '<div class="hist_data filler"></div>';
            $(element).html(html);
        },
        make_colorline : function (state) {
            if (state.raw_viewer)
                return;
            var element = $(state.element).find('div.timeline div.colorline').first();
            var maxwidth = $(element).width()-1;
            var firstbin = Math.floor((state.color_begin-state.begin)/(state.end-state.begin)*maxwidth);
            var lastbin = Math.floor((state.color_end-state.begin)/(state.end-state.begin)*maxwidth);
            var html = '';
            var prevwidth = 1;
            var highcontrast = state.high_contrast;
            var factor = 1/(lastbin-firstbin)*0.6666;
            var prevcolor = (highcontrast?'#FF0000':'#FF7F7F');
            var color = undefined, c = new THREE.Color();
            for (var i=1;i<=maxwidth;i++) {
                if (highcontrast) {
                    if (i < firstbin)
                        color = '#FF0000';
                    else if (i < lastbin) {
                        c.setHSL((i-firstbin)*factor,1,0.5);
                        color = decimalToHex(c.getHex());
                    } else
                        color = '#0000FF';
                } else {
                    if (i < firstbin)
                        color = '#FF7F7F';
                    else if (i < lastbin) {
                        c.setHSL((i-firstbin)*factor,1,0.75);
                        color = decimalToHex(c.getHex());
                    } else
                        color = '#7F7FFF';
                }
                if (prevcolor == color)
                    prevwidth += 1;
                else {
                    html += '<div class="color_data" style="background-color:'+prevcolor+';width:'+prevwidth+'px"></div>';
                    prevwidth = 1;
                    prevcolor = color;
                }
            }
            html += '<div class="color_data" style="background-color:'+prevcolor+';width:'+prevwidth+'px"></div>';
            $(element).html(html);
        },
        make_controls : function (state) {
            if (state.raw_viewer)
                return;
            var element = $(state.element).find('div.timeline div.controls').first();
            $(element).off();
            var parent = $('body');
            var maxwidth = $(element).width()-1;
            log.info('maxwidth:'+maxwidth);
            var firstbin = Math.floor((state.color_begin-state.begin)/(state.end-state.begin)*maxwidth);
            var lastbin = Math.floor((state.color_end-state.begin)/(state.end-state.begin)*maxwidth);
            console.log('firstbin: '+firstbin+'  lastbin: '+lastbin);
            var curbin = Math.floor((state.current_time-state.begin)/(state.end-state.begin)*maxwidth);
            var html = '<div class="time_marker" style="left:'+curbin+'px"><div class="inner_time_marker"></div></div>';
            if (state.high_contrast) {
                html += '<div class="color_marker begin_color" ';
                html += 'style="background-color:#ff0000;left:'+firstbin+'px"></div>';
                html += '<div class="color_marker end_color" ';
                html += 'style="background-color:#0000ff;left:'+lastbin+'px"></div>';
            } else {
                html += '<div class="color_marker begin_color" ';
                html += 'style="background-color:#ff7f7f;left:'+firstbin+'px"></div>';
                html += '<div class="color_marker end_color" ';
                html += 'style="background-color:#7f7fff;left:'+lastbin+'px"></div>';
            }
            $(element).html(html);
            var min_pos = Math.floor($(element).find('div.color_marker').first().width()/3)*-1;
            var max_pos = Math.floor(maxwidth+min_pos*2);
            var begin_color = $(element).find('div.begin_color');
            var end_color = $(element).find('div.end_color');
            $(begin_color).css('left',firstbin+min_pos);
            $(end_color).css('left',lastbin+min_pos*2);
            log.info('min_pos:'+min_pos);
            log.info('max_pos:'+max_pos);
            var time_func = (function(){
                var marker = $(element).find('div.time_marker');
                var radius = $(marker).width()/2;
                var isdrawing = false;
                var poslastdraw = $(marker).position().left;
                var lastdrawtimer = undefined;
                var drawthreshold = maxwidth/20;
                var min_pos = Math.floor($(marker).width()/2-1)*-1;
                var max_pos = Math.floor(maxwidth+min_pos-1);
                var methods = {
                    reset_to_state : function(){
                        var cur = Math.floor((state.current_time-state.begin)/(state.end-state.begin)*maxwidth-radius);
                        $(marker).css('left',cur);
                    },
                    to_cur_pos : function(dejitter,e) {
                        e.stopPropagation();
                        var offsetx = e.pageX-$(marker).offset().left-radius;
                        marker_pos_left = $(marker).position().left;
                        //if (dejitter && offsetx > -2 && offsetx < 2)
                        //    return;
                        //log.debug('offsetx='+offsetx);
                        if (offsetx > 0) {
                            if (marker_pos_left+offsetx < max_pos)
                                $(marker).css('left',marker_pos_left+offsetx);
                            else if (marker_pos_left != max_pos)
                                $(marker).css('left',max_pos);
                            else
                                return;
                        } else {
                            if (marker_pos_left+offsetx >= min_pos)
                                $(marker).css('left',marker_pos_left+offsetx);
                            else if (marker_pos_left != min_pos)
                                $(marker).css('left',min_pos);
                            else
                                return;
                        }
                        marker_pos_left = $(marker).position().left;
                        state.current_time = Math.floor((marker_pos_left+radius)/maxwidth*(state.end-state.begin)+state.begin);
                        // only do a full redraw occasionally
                        if ((!dejitter) || poslastdraw-marker_pos_left > drawthreshold || poslastdraw-marker_pos_left < -1*drawthreshold) {
                            if (lastdrawtimer != undefined) {
                                clearTimeout(lastdrawtimer);
                                lastdrawtimer = undefined;
                            }
                            poslastdraw = marker_pos_left;
                            private_methods.add_recopulses(state);
                            private_methods.display_artists(state);
                            private_methods.draw(state);
                        } else if (lastdrawtimer == undefined)
                            lastdrawtimer = setTimeout(function(){
                                private_methods.add_recopulses(state);
                                private_methods.display_artists(state);
                                private_methods.draw(state);
                                poslastdraw = marker_pos_left;
                                lastdrawtimer = undefined;
                            },250);
                    },
                    attach : function(e) {
                        e.stopPropagation();
                        $(element).addClass('active');
                        $(parent).on('mousemove vmousemove touchmove',function(e){
                            if (e.type == 'touchmove') {
                                e.pageX = e.originalEvent.touches[0].pageX;
                                e.pageY = e.originalEvent.touches[0].pageY;
                                e.originalEvent.preventDefault();
                            }
                            if (isdrawing == true) { return; }
                            isdrawing = true;
                            methods.to_cur_pos(true,e);
                            isdrawing = false;
                        });
                        $(parent).on('mouseup mouseleave mousecancel vmouseup vmousecancel touchend touchcancel',function() {
                            if (e.type == 'touchend' || e.type == 'touchcancel') {
                                e.originalEvent.preventDefault();
                            }
                            $(parent).off('mousemove mouseup mouseleave mousecancel vmousemove vmouseup vmousecancel touchmove touchend touchcancel');
                            $(element).removeClass('active');
                            if (lastdrawtimer != undefined) {
                                clearTimeout(lastdrawtimer);
                                lastdrawtimer = undefined;
                                pos_last_draw = $(marker).position().left;
                                private_methods.add_recopulses(state);
                                private_methods.display_artists(state);
                                private_methods.draw(state);
                            }
                        });
                    },
                };
                return methods;
            })();
            time_func.reset_to_state();
            $(element).find('div.time_marker').on('mousedown vmousedown touchstart',time_func.attach);
            $(element).on('mousedown vmousedown touchstart',function(e){
                e.stopImmediatePropagation();
                if (e.type == 'touchstart') {
                    e.pageX = e.originalEvent.touches[0].pageX;
                    e.pageY = e.originalEvent.touches[0].pageY;
                    e.originalEvent.preventDefault();
                }
                time_func.to_cur_pos(false,e);
                time_func.attach(e);
            });
            $(element).find('div.color_marker').each(function(){
                var marker = this;
                $(marker).on('mousedown vmousedown touchstart',function(e){
                    e.stopPropagation();
                    if (e.type == 'touchstart') {
                        e.pageX = e.originalEvent.touches[0].pageX;
                        e.pageY = e.originalEvent.touches[0].pageY;
                        e.originalEvent.preventDefault();
                    }
                    $(element).addClass('active');
                    // start draggable color marker
                    var begin_marker = $(marker).hasClass('begin_color');
                    var isdrawing = false;
                    var radius = $(marker).width()/2;
                    var poslastdraw = $(marker).position().left;
                    var lastdrawtimer = undefined;
                    var drawthreshold = maxwidth/20;
                    $(parent).on('mousemove vmousemove touchmove',function(e){
                        if (e.type == 'touchmove') {
                            e.pageX = e.originalEvent.touches[0].pageX;
                            e.pageY = e.originalEvent.touches[0].pageY;
                            //alert('touchmove: ('+e.pageX+','+e.pageY+')');
                            e.originalEvent.preventDefault();
                        }
                        if (isdrawing == true) { return; }
                        isdrawing = true;
                        var offsetx = e.pageX-$(marker).offset().left-radius;
                        if (offsetx > -2 && offsetx < 2) {
                            isdrawing = false;
                            return;
                        }
                        //log.debug('offsetx='+offsetx);
                        var marker_pos_left = $(marker).position().left;
                        if (offsetx > 0) {
                            //log.debug('move +');
                            var my_max_pos = max_pos;
                            if (begin_marker)
                                my_max_pos = $(end_color).position().left-radius;
                            if (marker_pos_left+offsetx <= my_max_pos)
                                $(marker).css('left',marker_pos_left+offsetx);
                            else if (marker_pos_left != my_max_pos)
                                $(marker).css('left',my_max_pos);
                            else {
                                isdrawing = false;
                                return;
                            }
                        } else {
                            //log.debug('move -');
                            var my_min_pos = min_pos;
                            if (!begin_marker)
                                my_min_pos = $(begin_color).position().left+radius;
                            if (marker_pos_left+offsetx >= my_min_pos)
                                $(marker).css('left',marker_pos_left+offsetx);
                            else if (marker_pos_left != my_min_pos)
                                $(marker).css('left',my_min_pos);
                            else {
                                isdrawing = false;
                                return;
                            }
                        }
                        marker_pos_left = $(marker).position().left;
                        var pos = Math.floor((marker_pos_left+radius)/maxwidth*(state.end-state.begin)+state.begin);
                        if (begin_marker)
                            state.color_begin = pos;
                        else
                            state.color_end = pos;
                        private_methods.make_colorline(state);
                        // only do a full redraw occasionally
                        if (poslastdraw-marker_pos_left > drawthreshold || poslastdraw-marker_pos_left < -1*drawthreshold) {
                            if (lastdrawtimer != undefined) {
                                clearTimeout(lastdrawtimer);
                                lastdrawtimer = undefined;
                            }
                            private_methods.add_recopulses(state);
                            private_methods.display_artists(state);
                            private_methods.draw(state);
                            poslastdraw = marker_pos_left;
                        } else if (lastdrawtimer == undefined)
                            lastdrawtimer = setTimeout(function(){
                                private_methods.add_recopulses(state);
                                private_methods.display_artists(state);
                                private_methods.draw(state);
                                poslastdraw = marker_pos_left;
                                lastdrawtimer = undefined;
                            },250);
                        isdrawing = false;
                    });
                    $(parent).on('mouseup mouseleave mousecancel vmouseup vmousecancel touchend touchcancel',function(){
                        if (e.type == 'touchend' || e.type == 'touchcancel') {
                            e.originalEvent.preventDefault();
                        }
                        $(parent).off('mousemove mouseup mouseleave mousecancel vmousemove vmouseup vmousecancel touchmove touchend touchcancel');
                        $(element).removeClass('active');
                        //log.debug('stop draggable');
                        if (lastdrawtimer != undefined) {
                            clearTimeout(lastdrawtimer);
                            lastdrawtimer = undefined;
                            private_methods.add_recopulses(state);
                            private_methods.display_artists(state);
                            private_methods.draw(state);
                        }
                    });
                });
            });
        },
        update_controls : function (state) {
            // reset position of time indicator
            if (state.raw_viewer)
                return;
            var element = $(state.element).find('div.timeline div.controls').first();
            var marker = $(element).find('div.time_marker');
            var maxwidth = $(element).width()-1;
            var radius = $(marker).width()/2;

            var min_pos = Math.floor($(marker).width()/2-2)*-1+radius;
            var max_pos = Math.floor(maxwidth+min_pos)-radius;
            var cur = Math.floor((state.current_time-state.begin)/(state.end-state.begin)*maxwidth-radius);
            if (cur >= max_pos)
                cur = max_pos;
            else if (cur < min_pos)
                cur = min_pos;
            $(marker).css('left',cur);
        },
        make_timeline : function (state) {
            if (!state.raw_viewer) {
                var element = $(state.element).find('div.timeline div.left_col').first();
                var html = '<div class="pulse_choose';
                if (state.pulse_choose) {
                    html += '"><select>';
                    var pulseseries_list = private_methods.find_all_pulseseries(state);
                    log.info('pulseseries_list: '+JSON.stringify(pulseseries_list));
                    for (var i=0;i<pulseseries_list.length;i++) {
                        html += '<option value="'+pulseseries_list[i]+'"';
                        if (pulseseries_list[i] == state.pulseseries)
                            html += ' selected';
                        html += '>'+pulseseries_list[i]+'</option>';
                    }
                    html += '</select>';
                } else
                    html += ' disabled">';
                html += '</div><div class="color_text">Color mapping:</div>'
                $(element).html(html);
                if (state.pulse_choose) {
                    $(element).find('div.pulse_choose select').on('change',function(){
                        state.pulseseries = this.value;
                        private_methods.display_frame(state);
                    });
                }
                var width = $(state.element).find('div.timeline').width()-$(element).width()-3;
                log.info('center col width set to '+width);
                $(state.element).find('div.timeline div.center_col').css('width',width);
                $(state.element).find('div.timeline div.center_col div').css('width',width);
            }
            private_methods.make_charge_hist(state);
            if (!state.raw_viewer) {
                private_methods.make_colorline(state);
                private_methods.make_controls(state);
            }
        },
        update_timeline : function(state) {
            private_methods.update_controls(state);
        },
        display_artists : function(state) {
            for(var a in state.active_artists) {
                try {
                    VIEWER.Artists[a](state,state.active_artists[a]);
                } catch (e) {
                    log.warn('artist '+a+' failed');
                    log.warn(e);
                }
            }
        },
        mouse_move : function (state, e) {
            if (e.type == 'touchmove') {
                e.pageX = e.originalEvent.touches[0].pageX;
                e.pageY = e.originalEvent.touches[0].pageY;
                e.originalEvent.preventDefault();
                if (e.originalEvent.touches.length == 2) {
                    private_methods.zoom(state,e);
                    return;
                }
            }
            if (state.isdrawing == true) { return; }
            state.isdrawing = true;
            var x = e.pageX;
            var y = e.pageY;
            if (state.prev_mouse_pos.x != null) {
                var offsetx = state.prev_mouse_pos.x-x;
                var offsety = state.prev_mouse_pos.y-y;

                if (state.shiftkey == true || (e.type == 'touchmove' && e.originalEvent.touches.length > 2)) {
                    private_methods.translate_viewer(state,offsetx,offsety);
                } else {
                    private_methods.rotate_viewer(state,offsetx,offsety);
                }
                private_methods.draw(state);
            }
            state.prev_mouse_pos.x = x;
            state.prev_mouse_pos.y = y;
            state.isdrawing = false;
        },
        touch_distance : function (event) {
            return Math.sqrt(Math.pow(event.originalEvent.touches[0].pageX-event.originalEvent.touches[1].pageX,2)+Math.pow(event.originalEvent.touches[0].pageY-event.originalEvent.touches[1].pageY,2));
        },
        zoom : function (state, event, delta) {
            if (delta == undefined && event.type == 'touchmove' && event.originalEvent.touches.length == 2) {

                if (state.zoom_touches == undefined) {
                    state.zoom_touches = private_methods.touch_distance(event);
                    return;
                }
                delta = 0.1 * (private_methods.touch_distance(event) - state.zoom_touches);
                if (Math.abs(delta) < 0.1)
                    return;
            }
            if (state.isdrawing == true && event.type != 'touchmove') {
                state.zoom_delta += delta;
                return;
            }
            //alert('delta:'+delta);
            isdrawing = true;
            delta += state.zoom_delta;
            state.zoom_delta = 0;
            state.zoom_touches = undefined;
            // decrease or increase r
            var new_r = state.cameraPos.r()-delta*100;
            if (new_r < 0.1)
                new_r = 0.1;
            state.cameraPos.r(new_r);
            private_methods.draw(state);
            state.isdrawing = false;
        },
        display_info : function ( state ) {
            // display file info/navigation
            if (state.raw_viewer)
                return;
            var html = '';
            if (state.navigation == true) {
                html = '<div class="navigation" style="text-align:center;width:'+state.width+'px">';
                html += '<button class="prev_frame" style="float:left">&lt;</button>';
                html += '<button class="next_frame" style="float:right">&gt;</button>';
                html += state.frameno;
                html += '</div>';
            }
            if (true) {//state.webgl == true) {
                html += '<div class="movie_control" style="text-align:center;width:'+state.width+'px">';
                html += '<button class="play_pause">';
                if (state.playing == true)
                    html += 'Pause';
                else
                    html += 'Play';
                html += '</button><button class="stop">';
                html += 'Stop and Reset</button></div>';
            }
            $(state.element).find('.fileinfo').html(html);

            if (true) {//state.webgl == true) {
                var play_pause = state.playing;
            }
            if (state.frameno <= 0)
                $(state.element).find('.fileinfo button.prev_frame').attr("disabled", true);
            else
                $(state.element).find('.fileinfo button.prev_frame').on('click',function(){
                    state.frameno -= 1;
                    private_methods.display_frame(state);
                });
            if (state.frameno+1 >= state.maxframes)
                $(state.element).find('.fileinfo button.next_frame').attr("disabled", true);
            else
                $(state.element).find('.fileinfo button.next_frame').on('click',function(){
                    state.frameno += 1;
                    private_methods.display_frame(state);
                });
            $(state.element).find('.fileinfo button.play_pause').on('click',function(){
                if (state.playing == true)
                    public_methods.pause(state);
                else
                    public_methods.play(state);
            });
            $(state.element).find('.fileinfo button.stop').on('click',partial(public_methods.stop,state));
        },
        display_frame : function ( state ) {
            log.info('display_frame()');
            var begin = -1, end = -1;
            if (state.frames == undefined) {
                log.warn('state.frames is undefined');
                return;
            }

            if (state.pulseseries == '' || !(state.pulseseries in state.frames[state.frameno])) {
                log.warn('pulseseries ('+state.pulseseries+') not in frame');
                return;
            }
            // make sure the pulseseries is ready to use
            private_methods.getpulses(state,state.pulseseries);
            if (state.webgl != true && state.canvas_full != true)
                private_methods.compress_recopulses(state);
            var pulses = state.frames[state.frameno][state.pulseseries];
            for (var dom in pulses) {
                if (pulses[dom]['data'].length < 1)
                    continue;
                var time = pulses[dom]['data'][0]['time'];
                var endtime = pulses[dom]['data'][pulses[dom]['data'].length-1]['time'];
                if (begin == -1) {
                    begin = time;
                    end = endtime;
                } else {
                    if (time < begin) {
                        begin = time;
                    }
                    if (endtime > end) {
                        end = endtime;
                    }
                }
            }
            state.begin = begin;
            state.end = end;
            if (!state.force_color_times) {
                console.log('resetting color times');
                state.color_begin = begin;
                state.color_end = end;
            } else {
                console.log('color times set manually: '+state.color_begin+' - '+state.color_end);
            }
            if (state.playing == true)
                state.current_time = begin;
            else
                state.current_time = end;
            log.warn('display_frame() current_time:'+state.current_time);
            private_methods.make_timeline(state);
            private_methods.update_frame(state);
            private_methods.display_info(state);
            log.debug('display_frame() end');
        },
        update_frame : function (state) {
            var obj, i;
            private_methods.add_recopulses(state);
            if (state.bestfit_line && 'LineFit' in state.frames[state.frameno])
                private_methods.add_linefit(state, state.frames[state.frameno]['LineFit']);
            else if (state.linefit != null && state.linefit != undefined) {
                state.scene.remove(state.linefit);
                delete state.linefit;
            }
            private_methods.update_timeline(state);
            private_methods.display_artists(state);
            private_methods.draw(state);
        },
        handle_keydown : function(state, e) {
            var c = (e.which)?e.which:e.keyCode;
            if (c == 16) { // shift
                state.shiftkey=true;
            } else {
                var offsetx = 0, offsety = 0;
                if (c == 37) { // left arrow
                    offsetx -= 10;
                } else if (c == 38) { // up arrow
                    offsety += 10;
                } else if (c == 39) { // right arrow
                    offsetx += 10;
                } else if (c == 40) { // down arrow
                    offsety -= 10;
                } else if (c == 107) { // add
                    private_methods.zoom(state,e,1);
                } else if (c == 109) { // subtract
                    private_methods.zoom(state,e,-1);
                } else if (c == 187) { // equal
                    private_methods.zoom(state,e,1);
                } else if (c == 189) { // dash
                    private_methods.zoom(state,e,-1);
                }
                if (offsetx != 0 || offsety != 0) {
                    if (state.shiftkey == true)
                        private_methods.translate_viewer(state, offsetx,offsety);
                    else
                        private_methods.rotate_viewer(state, offsetx,offsety);
                }
                private_methods.draw(state);
            }
            return false;
        },
        handle_keyup : function(state, e) {
            var c = (e.which)?e.which:e.keyCode;
            if (c == 16) { // shift
                state.shiftkey=false;
            }
            return false;
        },
        find_all_pulseseries : function(state) {
            var ret = [];
            for (var key in state.frames[state.frameno]) {
                var val = state.frames[state.frameno][key];
                try {
                    if (($.type(val) == 'array' && 'data' in val[0]) ||
                        ($.type(val) == 'object' && ('Apply' in val || 'sources' in val ||
                        ('source' in val && 'mask' in val && 'elements' in val))))
                        ret.push(key);
                } catch ( e ) { continue; }
            }
            return ret.sort();
        },
        getpulses : function(state, key) {
            // get the pulses behind a mask or union, replacing the key in the frame
            try {
                var frame = state.frames[state.frameno];
                if (key in frame) {
                    var obj = frame[key];
                    if ('Apply' in obj) {
                        // get a RecoPulseSeriesMap from some type of frame object
                        frame[key] = obj.Apply(frame);
                    } else if ('source' in obj && 'mask' in obj && 'elements' in obj) {
                        // I3RecoPulseSeriesMapMask
                        if (obj.source in frame) {
                            private_methods.getpulses(state,obj.source);
                            var source = frame[obj.source];
                            var newobj = [];
                            var mask = obj.mask;
                            var elements = obj.elements;
                            var element_index = 0;
                            log.debug('source length: '+source.length);
                            log.debug('mask length: '+mask.length);
                            var m=0;
                            for (;m<source.length;m++) {
                                if (!mask.isset(m))
                                    continue;
                                else if (elements[element_index].sum() == 0) {
                                    console.warn('element sum = 0 for m='+m+' and element_index='+element_index);
                                    element_index++;
                                    continue;
                                }
                                var n = {om:source[m].om,
                                         pmt:source[m].pmt,
                                         string:source[m].string,
                                         data:[]};

                                if (source[m].data.length != elements[element_index].length) {
                                    throw new Error('The mask for OM('+(source[m].om)+','+(source[m].pmt)+' has '+(elements[element_index].length)+' entries, but source pulse vector has '+(source[m].data.length)+' entries!');
                                }
                                for (var e=0;e<elements[element_index].length;e++) {
                                    if (e >= source[m].data.length)
                                        throw new Error('more element bits in mask than in source for m='+m)
                                    if (elements[element_index].isset(e)) {
                                        n.data.push(source[m].data[e]);
                                    }
                                }
                                element_index++;
                                newobj.push(n);
                            }
                            log.debug('element length: '+elements.length);
                            log.debug('elements used: '+element_index);
                            log.debug('last index: '+m);
                            frame[key] = newobj;
                        }
                    } else if ('sources' in obj) {
                        // I3RecoPulseSeriesMapUnion
                        var union = [];
                        for (var s=0;s<obj.sources.length;s++) {
                            var source = obj.sources[s];
                            if (source in frame) {
                                private_methods.getpulses(state,source);
                                for (var i=0;i<frame[source].length;i++) {
                                    union.push(frame[source][i]);
                                }
                            }
                        }
                        frame[key] = union;
                    }
                }
            } catch ( e ) {
                throw e;
                log.warn('error getting pulses for key '+key+'  '+e+' line:'+e.lineNumber);
            }
        }
    };


    var public_methods = {
        load_gcd : function( state, filename, callback ){
            log.debug('load_gcd '+JSON.stringify(filename));
            state.downloader({'function':'getGCD',
                              'gcd_filename':filename
                             },function(ret){
                state.geometry = ret['data'];
                var redraw = state.canvas_full;
                private_methods.add_strings(state);
                private_methods.draw(state);
                if (redraw == true && state.webgl != true && state.canvas_full != true) {
                    // redraw strings with lower quality
                    private_methods.add_strings(state);
                    private_methods.draw(state);
                }
                if (callback != undefined) {
                    callback();
                }
            });
        },
        load_data : function( state, filename, frametype, callback ){
            log.debug('load_data '+filename);
            if (frametype == undefined) { frametype = 'P'; }
            state.downloader({'function':'getI3',
                              'i3_filename':filename,
                              'frame_type':frametype
                             },function(ret){
                state.frames = ret['data'];
                state.frameno = 0;
                state.maxframes = 0;
                for (var f=0;f < state.frames.length;f++) {
                    state.maxframes++;
                }
                log.info('maxframes:'+state.maxframes);
                state.pulseseries = '';
                if (state.maxframes > 0)
                    for (var i=0;i<state.preferred_pulseseries.length;i++) {
                        var p = state.preferred_pulseseries[i];
                        if (p in state.frames[0]) {
                            state.pulseseries = p;
                            break;
                        }
                    }
                log.info('pulseseries:'+state.pulseseries);
                // display first frame
                private_methods.display_frame(state);
                if (callback != undefined) {
                    callback();
                }
            });
        },
        set_gcd_data : function(state, geometry, i3data) {
            state.geometry = geometry;
            var redraw = state.canvas_full;
            private_methods.add_strings(state);
            private_methods.draw(state);
            if (redraw == true && state.webgl != true && state.canvas_full != true) {
                // redraw strings with lower quality
                private_methods.add_strings(state);
                private_methods.draw(state);
            }
            state.frames = i3data;
            //console.log(state.frames);
            state.frameno = 0;
            state.maxframes = 0;
            for (var f=0;f < state.frames.length;f++) {
                state.maxframes++;
            }
            log.info('maxframes:'+state.maxframes);
            state.pulseseries = '';
            if (state.maxframes > 0)
                for (var i=0;i<state.preferred_pulseseries.length;i++) {
                    var p = state.preferred_pulseseries[i];
                    if (p in state.frames[0]) {
                        state.pulseseries = p;
                        break;
                    }
                }
            log.info('pulseseries:'+state.pulseseries);
            // display first frame
            private_methods.display_frame(state);
        },
        set_center : function(state, x, y, z) {
            // set a new center position
            state.centerPos.x(x);
            state.centerPos.y(y);
            state.centerPos.z(z);
            private_methods.draw(state);
        },
        set_camera : function(state, x, y, z) {
            // set a new camera position
            state.cameraPos = vector3d();
            state.cameraPos.x(x);
            state.cameraPos.y(y);
            state.cameraPos.z(z);
        },
        set_navigation : function(state, nav) {
            // set the navigation controls to enabled or disabled
            state.navigation = !!nav;
            private_methods.display_frame(state);
        },
        set_fiducial : function(state, val) {
            state.show_fiducial = !!val;
            private_methods.add_strings(state);
            private_methods.update_frame(state);
        },
        play : function( state ) {
            // only enable playing when webgl is active
            var frames_per_event = 150;
            var frame_delay = 67;
            var frame_end_delay = 1000;
            if (state.webgl != true && state.canvas_full != true) {
                frames_per_event = 30;
                frame_delay = 333;
            }
            if (state.playing == false) {// && state.webgl == true) {
                state.playing = true;
                state.animation_timer = setTimeout(function animate(){
                    if (state.current_time >= state.end)
                        state.current_time = state.begin;
                    else {
                        state.current_time += (state.end-state.begin)/frames_per_event;
                        if (state.current_time > state.end)
                            state.current_time = state.end;
                    }
                    private_methods.update_frame(state);
                    if (state.current_time >= state.end) {
                        // loop to beginning
                        state.animation_timer = setTimeout(animate, frame_end_delay);
                    } else
                        state.animation_timer = setTimeout(animate, frame_delay);
                }, frame_delay);
                if (!state.raw_viewer)
                    $(state.element).find('.fileinfo button.play_pause').text('Pause');
            }
        },
        pause : function( state ) {
            if (state.playing == true) {
                state.playing = false;
                clearTimeout(state.animation_timer);
                if (!state.raw_viewer)
                    $(state.element).find('.fileinfo button.play_pause').text('Play');
            }
        },
        stop : function( state ) {
            if (state.playing == true) {
                state.playing = false;
                clearTimeout(state.animation_timer);
                if (!state.raw_viewer)
                    $(state.element).find('.fileinfo button.play_pause').text('Play');
            }
            state.current_time = state.end;
            private_methods.update_frame(state);
            private_methods.draw(state);
        },
        take_screenshot : function( state, mimetype ) {
            if (!state.allow_screenshot)
                return;
            if (mimetype == undefined)
                mimetype = 'image/png';
            return state.renderer.domElement.toDataURL(mimetype);
        },
        replace_with_image : function( state, callback ) {
            if (!state.allow_screenshot)
                return false;
            var mimetype = 'image/png';
            var image = state.renderer.domElement.toDataURL(mimetype);
            if (image) {
                var canvas_holder = {canvas:$(state.element).find('canvas').first()};
                var canvas_width = $(canvas_holder.canvas).width();
                var canvas_height = $(canvas_holder.canvas).height();
                delete state.renderer;
                var img = document.createElement('img');
                img.src = image;
                img.width = canvas_width;
                img.height = canvas_height;
                if (state.high_contrast)
                    $(img).css('background-color','#111');
                else
                    $(img).css('background-color','#262626');
                $(canvas_holder.canvas).unmousewheel();
                $(canvas_holder.canvas).off().replaceWith(img);
                delete canvas_holder.canvas;
                $(document).off('keydown keyup');
                console.warn('canvas is petrified');
                $(state.element).find('div.drawing img').first().on('mousedown vmousedown',function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).off('mousedown vmousedown');
                    var img_handle = this;
                    $(this).after('<canvas width="'+canvas_width+'" height="'+canvas_height+'" style="position:absolute;left:-'+($(document).width()+canvas_width*2)+'px"></canvas>');
                    var screen_canvas = $(state.element).find('canvas').first();
                    // add events for rotate/translate/zoom
                    $(screen_canvas).on('mousedown vmousedown touchstart',function(e){
                        if (e.type == 'touchstart') {
                            e.originalEvent.preventDefault();
                            if (e.originalEvent.touches.length > 1) {
                                if (e.originalEvent.touches.length == 2 && state.zoom_touches == undefined)
                                    state.zoom_touches = private_methods.touch_distance(event);
                                return true;
                            }
                        }
                        $(screen_canvas).on('mousemove vmousemove touchmove',partial(private_methods.mouse_move,state));
                    });
                    function off(e){
                        $(screen_canvas).off('mousemove vmousemove touchmove');
                        state.isdrawing = false;
                        state.zoom_touches = undefined;
                        state.prev_mouse_pos.x=null;state.prev_mouse_pos.x=null;
                    }
                    $(screen_canvas).on('mouseup vmouseup touchend touchcancel',off);
                    $(screen_canvas).on('mouseout vmouseout touchleave',off);
                    $(screen_canvas).mousewheel(partial(private_methods.zoom,state),true);
                    $(document).keydown(partial(private_methods.handle_keydown,state));
                    $(document).keyup(partial(private_methods.handle_keyup,state));
                    private_methods.setup_renderer(state,function(){
                        private_methods.add_strings(state);
                        private_methods.update_frame(state);
                        $(img_handle).remove();
                        $(screen_canvas).css({position:'relative',left:0});
                        log.warn('canvas is restored');
                        $(screen_canvas).trigger('mousedown vmousedown');
                        if (callback)
                            callback.apply(screen_canvas);
                    });
                });
                return true;
            }
            return false;
        }
    };

    var init = function( state, callback ) {
        state = $.extend({
            domain : '',
            element : $(document),
            webgl : false,
            navigation : false,
            raw_viewer : false,
            show_fiducial : false,
            high_contrast : false,
            playing : false,
            isdrawing : false,
            prev_mouse_pos : { x : null, y : null },
            shiftkey : false,
            allow_screenshot : false,
            zoom_delta : 0,
            pulse_choose : true,
            preferred_pulseseries : ['OfflinePulses','InIcePulses','OfflinePulseSeriesReco','IceTopPulses'],
            bestfit_line: true,
            smart_color: false,
            force_color_times: false,
            color_begin: 0,
            color_end: 3000,
            active_artists : {'accumulated_charge_counter':true},
            downloader : undefined,
            webgl : undefined,
            canvas_full : true
        },state);
        state.downloader = partial(viewerAjaxCaller,state.domain+'/ajax');
        log.info(state.preferred_pulseseries);

        var maxwidth = $(state.element).innerWidth();
        var maxheight = $(state.element).innerHeight();

        var canvas_height = maxheight;
        if (!state.raw_viewer)
            canvas_height -= 110;
        var html = '<div class="drawing"><canvas width="'+maxwidth+'" height="'+canvas_height+'">Sorry, this viewer requires';
        html += ' a web browser which supports HTML5 canvas!</canvas>';
        if (!state.raw_viewer) {
            html += '<div class="timeline" style="width:'+maxwidth+'px">';
            html += '<div class="left_col"></div><div class="center_col">'
            html += '<div class="controls"></div><div class="charge_hist"></div>';
            html += '<div class="colorline"></div></div></div>'; // end timeline
            html += '</div><div class="fileinfo"></div><div class="frames" style="display:none">';
        }
        html += '</div>';
        $(state.element).html(html);

        var screen_canvas = $(state.element).find('canvas').first();
        log.debug('canvas : '+JSON.stringify(screen_canvas.length));
        state.width = $(screen_canvas).width();
        state.height = $(screen_canvas).height();
        state.frameno = 0;
        log.debug('canvas width:'+state.width+' height:'+state.height);

        // setup renderer
        private_methods.setup_renderer(state,callback);

        // setup default positions
        state.centerPos = vector3d();
        state.centerPos.z(800);
        state.cameraPos = vector3d();
        state.cameraPos.rho(2000);
        state.cameraPos.z(1450);

        // add events for rotate/translate/zoom
        $(screen_canvas).on('mousedown vmousedown touchstart',function(e){
            if (e.type == 'touchstart') {
                e.originalEvent.preventDefault();
                if (e.originalEvent.touches.length > 1) {
                    if (e.originalEvent.touches.length == 2 && state.zoom_touches == undefined)
                        state.zoom_touches = private_methods.touch_distance(event);
                    return true;
                }
            }
            $(screen_canvas).on('mousemove vmousemove touchmove',partial(private_methods.mouse_move,state));
        });
        function off(e){
            $(screen_canvas).off('mousemove vmousemove touchmove');
            state.isdrawing = false;
            state.zoom_touches = undefined;
            state.prev_mouse_pos.x=null;state.prev_mouse_pos.x=null;
        }
        $(screen_canvas).on('mouseup vmouseup touchend touchcancel',off);
        $(screen_canvas).on('mouseout vmouseout touchleave',off);
        $(document).keydown(partial(private_methods.handle_keydown,state));
        $(document).keyup(partial(private_methods.handle_keyup,state));
        $(screen_canvas).mousewheel(partial(private_methods.zoom,state),true);

        return state;
    };

    return function(args,callback) {
        var state = init(args,callback);
        if (state === false) {
            log.debug('state == false');
            return false;
        }
        var methods = {};
        for(var m in public_methods) {
            methods[m] = partial(public_methods[m], state);
        }
        return methods;
    }
};

// insert the viewer into the global namespace
IceCubeViewer = viewer(jQuery);
