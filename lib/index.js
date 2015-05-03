var arDrone = require('ar-drone'),
    arDroneConstants = require('ar-drone/lib/constants'),
    autonomy = require('ardrone-autonomy'),
    _ = require('lodash');

// var createRepl = true;
var createRepl = false;

var client  = arDrone.createClient();
var ctrl    = new autonomy.Controller(client, {debug: false});
if (createRepl) {
    var repl    = client.createRepl();
};

function navdata_option_mask(c) {
  return 1 << c;
}

// From the SDK.
var navdata_options = (
    navdata_option_mask(arDroneConstants.options.DEMO)
  | navdata_option_mask(arDroneConstants.options.VISION_DETECT)
  // | navdata_option_mask(arDroneConstants.options.MAGNETO)
  | navdata_option_mask(arDroneConstants.options.WIFI)
);

// Connect and configure the drone
client.config('general:navdata_demo', true);
client.config('general:navdata_options', navdata_options);
client.config('video:video_channel', 1);
// Detect a certain type of tag
client.config('detect:detect_type', arDroneConstants.CAD_TYPE.ORIENTED_COCARDE_BW);

// Add a ctrl object to the repl. You can use the controller
// from there. E.g.
// ctrl.go({x:1, y:1});
if (repl) {
    repl._repl.context.ctrl = ctrl;
    repl._repl.context.client = client;
};

function AROilFinder(client, ctrl, options) {
    this._options = _.extend({
        target_altitute: 3
    });
    this.ctrl = ctrl;
    this.client = client;
    // Start after 1 second to avoid navdata unavailable issues
    // not sure how to solve this.
    setTimeout(this.start.bind(this), 1000);
    // setTimeout(this.stop.bind(this), 8000);
}

// AROilFinder.prototype. = function(cb){
// }

AROilFinder.prototype.start = function(cb){
    console.log('ran start');
    ar = this;
    ar.ctrl.zero();
    this.client.takeoff(function(){
        console.log('took off');
        ar.ctrl.zero();
        ar.ctrl.enable();
        // Above humans
        ar.ctrl.up(ar._options.target_altitute);
        ar.ctrl.hover();
    })
}

AROilFinder.prototype.stop = function(cb){
    console.log('landing')
    this.client.land(function(){
        console.log('landed!')
        if (typeof cb == 'function') {
            cb()
        }
    })
}

ar_finder = new AROilFinder(client, ctrl)

// Land on ctrl-c
var exiting = false;
process.on('SIGINT', function() {
    if (exiting) {
        process.exit(0);
    } else {
        console.log('Got SIGINT. Landing, press Control-C again to force exit.');
        exiting = true;
        ar_finder.stop(function() {
            process.exit(0);
        });
    }
});

// Logging of data for debugging

function SetupLogging(controller) {
    var fs = require('fs'),
        path = require('path'),
        df = require('dateformat'),
        csvWriter = require('csv-write-stream');
        // csv = require('to-csv');

    var file_ts = df(new Date(), 'mm-dd-yy_hh_MM-ss')
    var ts_folder = path.resolve('./logs')

    var nav_log = null,
        control_log = null;

    fs.mkdir(ts_folder, function(){
        nav_log = csvWriter()
        control_log = csvWriter()
        nav_log.pipe(fs.createWriteStream(path.join(ts_folder, file_ts+'_navData.csv')))
        control_log.pipe(fs.createWriteStream(path.join(ts_folder, file_ts+'_controlData.csv')))
        register_event_listeners()
    })

    function register_event_listeners() {
        client.on('navdata', function(nd) {
            // console.dir(navdata)
            // console.log('nav!')
            // console.log(JSON.stringify(nd));
            // process.exit(0)
            output = {
                'status_flying': nd.droneState.flying
            }
            if (nd.visionDetect) {
                output.tags = nd.visionDetect.nbDetected
            }
            nav_log.write(output)
        });

        controller.on('controlData', function(d) {
            // control_log.write()
            // convert to csv
            control_log.write({
                'state_x': d.state.x,
                'state_y': d.state.y,
                'state_z': d.state.z,
                'state_yaw': d.state.yaw,
                'state_vx': d.state.vx,
                'state_vy': d.state.vy,
                'goal_x': d.goal.x,
                'goal_y': d.goal.y,
                'goal_z': d.goal.z,
                'goal_yaw': d.goal.yaw,
                'error_ex': d.error.ex,
                'error_ey': d.error.ey,
                'error_ez': d.error.ez,
                'error.eyaw': d.error.eyaw,
                'control_ux': d.control.ux,
                'control_uy': d.control.uy,
                'control_uz': d.control.uz,
                'control_uyaw': d.control.uyaw,
                'last_ok': d.last_ok,
                'tag': d.tag
            })
        });
    }
}

SetupLogging(ctrl);

