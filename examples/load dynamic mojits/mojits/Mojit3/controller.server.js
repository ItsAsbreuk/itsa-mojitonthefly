/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('mojit3', function(Y, NAME) {

/**
 * The home module.
 *
 * @module home
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            var cfg = {
                    view: 'index',
                    children: {
                        m3header: { type: 'Mojit3Header', action: 'index' },
                        m3body: { type: 'Mojit3Body', action: 'index' },
                        m3footer: { type: 'Mojit3Footer', action: 'index' }
                    }
                };
            ac.assets.addCss('./index.css');
            ac.composite.execute(cfg, function(data, meta){
                ac.done(data, meta);
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-composite-addon']});
