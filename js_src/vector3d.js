var vector3d = function(){
    var data = {
        x:0,
        y:0,
        z:0
    };
    var methods = {
        x:function(input){
            if (input != null) {
                data.x = input;
            } else {
                return data.x;
            }
        },
        y:function(input){
            if (input != null) {
                data.y = input;
            } else {
                return data.y;
            }
        },
        z:function(input){
            if (input != null) {
                data.z = input;
            } else {
                return data.z;
            }
        },
        rho:function(input){
            if (input != null) {
                var phi = methods.phi();
                data.x = input*Math.cos(phi);
                data.y = input*Math.sin(phi);
            } else {
                return Math.sqrt(data.x*data.x+data.y*data.y);
            }
        },
        phi:function(input){
            if (input != null) {
                var rho = methods.rho();
                data.x = rho*Math.cos(input);
                data.y = rho*Math.sin(input);
            } else {
                return Math.atan2(data.y,data.x);
            }
        },
        r:function(input){
            if (input != null) {
                var theta = methods.theta();
                var phi = methods.phi();
                data.x = input*Math.cos(theta)*Math.cos(phi);
                data.y = input*Math.cos(theta)*Math.sin(phi);
                data.z = input*Math.sin(theta);
            } else {
                return Math.sqrt(data.x*data.x+data.y*data.y+data.z*data.z);
            }
        },
        theta:function(input){
            var r = methods.r();
            if (input != null) {
                var phi = methods.phi();
                data.x = r*Math.cos(input)*Math.cos(phi);
                data.y = r*Math.cos(input)*Math.sin(phi);
                data.z = r*Math.sin(input);
            } else {
                if (r == 0) { return 0; }
                else {
                    return Math.asin(data.z/methods.r());
                }
            }
        },
    };
    return methods;
}