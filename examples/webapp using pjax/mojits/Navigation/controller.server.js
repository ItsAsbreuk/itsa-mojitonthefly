/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('navigation', function(Y, NAME) {

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
            var data = {},
                selectedmojit = ac.params.getFromRoute('mojit') || 'none';
            data[selectedmojit] = true;
            ac.assets.addCss('./index.css');
            ac.done(data);
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-params-addon', 'itsa-mojitonthefly-addon']});
