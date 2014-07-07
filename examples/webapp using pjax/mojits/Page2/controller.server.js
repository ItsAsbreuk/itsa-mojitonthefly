/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('page2', function(Y, NAME) {

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
                        p2header: { type: 'Page2Header', action: 'index' },
                        p2body: { type: 'Page2Body', action: 'index' },
                        p2footer: { type: 'Page2Footer', action: 'index' }
                    }
                };
            ac.assets.addCss('./index.css');
            ac.composite.execute(cfg, function(data, meta){
                ac.done(data, meta);
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-composite-addon']});
