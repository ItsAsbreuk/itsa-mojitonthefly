/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('body', function(Y, NAME) {

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

        compose: function(ac, mojit) {
            var cfg = {
                    view: 'index',
                    children: {
                        navigation: { type: 'Navigation', action: 'index', params: {route: {mojit: mojit}} },
                        container: { type: mojit, action: 'index' }
                    }
                };
            ac.assets.addCss('./index.css');
            ac.composite.execute(cfg, function(data, meta){
                ac.done(data, meta);
            });
        },
        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        home: function(ac) {
            this.compose(ac, 'Home');
        },

        page1: function(ac) {
            this.compose(ac, 'Page1');
        },

        page2: function(ac) {
            this.compose(ac, 'Page2');
        },

        page3: function(ac) {
            this.compose(ac, 'Page3');
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-params-addon', 'mojito-composite-addon', 'itsa-mojitonthefly-addon']});
