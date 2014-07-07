/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('home-binder-index', function(Y, NAME) {

/**
 * The home-binder-index module.
 *
 * @module home-binder-index
 */

    var PURE_BUTTON_ACTIVE = 'pure-button-active';

    /**
     * Constructor for the HomeBinderIndex class.
     *
     * @class HomeBinderIndex
     * @constructor
     */
    Y.namespace('mojito.binders')[NAME] = {

        /**
         * Binder initialization method, invoked after all binders on the page
         * have been constructed.
         */
        init: function(mojitProxy) {
            var instance = this;
            instance.mojitProxy = mojitProxy;
            instance.mojitname = 'Mojit1';
            instance.containername = '#container1';
            instance.codedescriptionCont = Y.one('.codedescription');
            instance.refreshCodedescription();
        },

        refreshCodedescription: function() {
            var instance = this;
            instance.codedescriptionCont.set("text", "Y.one('"+instance.containername+"').loadMojit('"+instance.mojitname+"');");
        },

        /**
         * The binder method, invoked to allow the mojit to attach DOM event
         * handlers.
         *
         * @param node {Node} The DOM node to which this mojit is attached.
         */
        bind: function(node) {
            var instance = this,
                mojitselectionCont = Y.one('.mojitselection'),
                mojitselectionButtons = mojitselectionCont.all('button'),
                containerselectionCont = Y.one('.containerselection'),
                containerselectionButtons = containerselectionCont.all('button');

            mojitselectionCont.delegate(
                'click',
                function(e) {
                    var btn = e.currentTarget;
                    mojitselectionButtons.removeClass(PURE_BUTTON_ACTIVE);
                    btn.addClass(PURE_BUTTON_ACTIVE);
                    instance.mojitname = btn.getAttribute('data-loadmojit');
                    instance.refreshCodedescription();
                },
                'button'
            );

            containerselectionCont.delegate(
                'click',
                function(e) {
                    var btn = e.currentTarget;
                    containerselectionButtons.removeClass(PURE_BUTTON_ACTIVE);
                    btn.addClass(PURE_BUTTON_ACTIVE);
                    instance.containername = btn.getAttribute('data-loadcontainer');
                    instance.refreshCodedescription();
                },
                'button'
            );

            Y.one('button.execute').on(
                'click',
                function() {
                    var node = Y.one(instance.containername);
                    node && node.loadMojit(instance.mojitname);
                }
            );

        }

    };

}, '0.0.1', {requires: ['mojito-client', 'node-event-delegate', 'event', 'itsa-mojitonthefly']});
