AROilFinder = require('../lib/oil_finder').AROilFinder;

square_move = AROilFinder.prototype.square_move_pattern

context = {
    ctrl: {
        forward: function() {},
        right: function() {}
    },
    _options: {
        move: {
            square:{
                sideways_travel: 2,
                forward_travel: 1,
                bands: 3,
                time_between_steps: 3000
            }
        }
    },
    _state: {
        square:{
            type: 'forward',
            sideways_direction: 1,
            forward_direction: 1,
            forward_counter: 0
        }
    },
    next_movement: function(){},
    next_movement: function(){}
}

square_move.call(context)
