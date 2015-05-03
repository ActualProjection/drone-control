_ = require('lodash');
negate = require('./utils').negate


function AROilFinder(client, ctrl, options) {
    this._options = _.extend({
        // target_altitute: 2.6,
        target_altitute: 1.3,
        // refresh_rate: hz(2),
        found_animation: 'snakeGreenRed',
        // allowed movement patterns
        move: {
            square: {
                sideways_travel: 2,
                forward_travel: 1,
                bands: 3,
                // A timeout between travel steps
                time_between_steps: 5000
            },
            forward: true
        },
        // movement_pattern: 'forward',
        movement_pattern: 'square',
        // TODO test
        return_home: false
    });

    this._state = {
        found_oil: false
    }

    this.ctrl = ctrl;
    this.client = client;
    this.register_listeners()

    // Start after 1 second to avoid navdata unavailable issues
    // not sure how to solve this.
    console.log('starting movements')
    setTimeout(this.start.bind(this, this.next_movement.bind(this)), 1000);
    return this
}

AROilFinder.prototype.next_movement = function(pattern){
    // Check if we're settings a new pattern
    if (pattern && this._options.move[pattern]) {
        this._options.movement_pattern = pattern
    };
    // Don't continue if we've found 'oil'
    if (!this._state.found_oil){
        this[this._options.movement_pattern+"_move_pattern"]()
    }
}

AROilFinder.prototype.forward_move_pattern = function(){
    // just move forward for now
    console.log('moving forward')
    ar = this
    this.ctrl.forward(0.5, ar.next_movement.bind(this))
}

AROilFinder.prototype.square_move_pattern = function(){
    ar = this
    // just move forward for now
    // only call next movement want so we can use it as multiple callbacks
    next_movement = _.once(ar.next_movement.bind(ar))
    state = ar._state
    square_options = ar._options.move.square
    // initialize state
    if (!state.square) {
        state.square = {
            type: null,
            sideways_direction: 1,
            forward_direction: 1,
            forward_counter: 0
        }
    };
    switch(state.square.type){
        case 'forward':
            distance = square_options.forward_travel
            direction = state.square.forward_direction * distance
            // after movement go sideways
            state.square.type = 'sideways'
            // now move forward
            state.square.forward_counter++
            // every 3 bands change direction
            if (state.square.forward_counter % square_options.bands) {
                state.square.forward_direction = negate(state.square.forward_direction)
            };
            console.log('moving forwards:', distance, direction, state.square)
            ar.ctrl.forward(direction, next_movement)
            setTimeout(next_movement, square_options.time_between_steps)
        break;
        case 'sideways':
            distance = square_options.sideways_travel
            direction = state.square.sideways_direction * distance
            // next movement is to go forward
            state.square.type = 'forward'
            // reverse next sideways movement
            state.square.sideways_direction = negate(state.square.sideways_direction)
            // move sideways
            console.log('moving sideways:', distance, direction, state.square)
            ar.ctrl.right(direction, next_movement)
            setTimeout(next_movement, square_options.time_between_steps)
        break;
        default:
            // move sideways half the required distance
            distance = square_options.sideways_travel / 2
            direction = negate(state.square.forward_direction) * distance
            // next move forward
            state.square.type = 'forward'
            console.log('moving initial sideways:', distance, direction, state.square)
            ar.ctrl.right(direction, next_movement)
            setTimeout(next_movement, square_options.time_between_steps)
        break;
    }
}

AROilFinder.prototype.register_listeners = function(){
    ar = this
    this.client.on('navdata', function(nd) {
        if (nd.visionDetect && nd.visionDetect.nbDetected) {
            ar._state.found_oil = true
            ar.found_indicator()
        }
    })
}

// only fire the found indicator once.
AROilFinder.prototype.found_indicator = _.once(function(){
    // blink for 4 seconds
    this.client.animateLeds(this._options.found_animation, 3, 4)
    console.log('found an oil spill!')
    // Set the goal to the current position, essentially stopping
    current_state = this.ctrl.state()
    this.ctrl.go(current_state)
    setTimeout(this.stop.bind(this), 3000)
})

AROilFinder.prototype.start = function(cb){
    console.log('ran start');
    ar = this;
    // ar.ctrl.zero();
    this.client.takeoff(function(){
        console.log('took off');
        ar.ctrl.zero();
        ar.ctrl.enable();
        // Above humans
        ar.ctrl.altitude(ar._options.target_altitute, cb);
    })
}

AROilFinder.prototype.stop = _.once(function(cb){
    ar = this
    function land() {
        console.log('landing')
        ar.client.land(function(){
            console.log('landed!')
            if (typeof cb == 'function') {
                cb()
            }
        })
    }
    if (this._options.return_home) {
        // return home then land
        this.ctrl.go({x: 0, y: 0}, land)
    }else{
        land()
    }
})

module.exports = {
    'AROilFinder': AROilFinder
}
