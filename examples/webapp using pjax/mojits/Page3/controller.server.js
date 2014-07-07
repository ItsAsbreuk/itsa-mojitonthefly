/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('page3', function(Y, NAME) {

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
            ac.assets.addCss('./index.css');
            Y.later(4000, null, function() {
                ac.done();
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon']});
