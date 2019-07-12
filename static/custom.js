// custom javascript

var viewer = undefined;
function load_viewer(gcdfile,datafile,frametype){
    if (!frametype) { frametype = 'P'; }
    viewer.set_center(50,50,-50);
    viewer.set_camera(1250,-460,300);
    viewer.load_gcd(gcdfile,function(){
        viewer.load_data(datafile,frametype);
    });
}

function choose_files_loader(){
    var gcdfile = $('#gcdfile').val();
    var datafile = $('#datafile').val();
    var frametype = $('#frametype').val();
    $('#filechooser').remove();
    $('#main').show();
    load_viewer(gcdfile,datafile,frametype);
}

function choose_files(){
    var datafile = '/net/user/dschultz/Diffuse-HEEvents_unblinded.i3.gz';
    var gcdfile = '/net/user/dschultz/Diffuse-HEEvents_unblinded.i3.gz';
    var frametype = 'P';
    
    var html = '<div id="filechooser">';
    html += '<h3>Choose file to view:</h3>';
    html += '<div>GCD File: <input id="gcdfile" type="text" value="'+gcdfile+'" style="width:800px" /></div>';
    html += '<div>I3 File: <input id="datafile" type="text" value="'+datafile+'" style="width:800px" /></div>';
    html += '<div>Frame Type: <input id="frametype" type="text" value="'+frametype+'" /></div>';
    html += '<button onclick="choose_files_loader()">Load</button>'
    html += '</div>';
    $('#main').before(html);
    $('#main').hide();
}

custom = function(domain,element) {
    // execute when page is fully loaded  
    viewer = viewer_wrapper({domain:domain,element:'#main',right_col_offset:0,navigation:true});
    if (!viewer) {
        $('#main').remove();
        Detector.addGetWebGLMessage();
        return;
    }
    var hash = window.location.hash.slice(1);
    if (!hash) { hash = ''; }
    if (hash == '') {
        // no files to load
        choose_files();
    } else {
        // files pre-selected
        var files = hash.split(',');
        var gcdfile = files[0];
        var file_array = [];
        for (var i=0;i<files.length;i++) {
            if (files[i].toLowerCase().indexOf('gcd') >= 0) {
                gcdfile = files[i];
                continue;
            }
            file_array.push({gcdfile: gcdfile,
                             datafile: files[i]
                            });
        }
        load_viewer(file_array[0].gcdfile,file_array[0].datafile);
    }
};
