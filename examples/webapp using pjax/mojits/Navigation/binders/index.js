/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('navigation-binder-index', function(Y, NAME) {

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
            var instance = this,
                container = Y.one('.container');
            instance.menu = Y.one('.pure-menu');
            instance.allAnchor = instance.menu.all('a'),
            instance.codedescriptionCont = Y.one('.codedescription');
            // be sure to include the module 'itsa-mojitonthefly' before calling Y.mojito.pjax
            Y.mojito.pjax.setContainer(container);


            // deactivate data-pjax-mojit, but store its value inside data-pjaxbackup
            // we need to delay, the module 'itsa-mojitonthefly' inspects the anchorelements after 60 sec. for data-pjax-mojit attributes
            Y.later(
                100,
                null,
                function() {
                    instance.switchAttribute(false);
                    instance.refreshCodedescription();
                }
            );
        },

        refreshCodedescription: function() {
            var instance = this;
            instance.codedescriptionCont.setHTML(instance.menu.getHTML().replace(/ id="[a-z0-9_]+"/g, '')
                                                                        .replace(/</g, '&lt;')
                                                                        .replace(/>/g, '&gt;')
                                                                        .replace(/&lt;li/g, '<br>&nbsp;&nbsp;&nbsp;&nbsp;&lt;li')
                                                                        .replace(/&lt;\/ul&gt;/g, '<br>&lt;/ul&lt;'));
        },

        switchAttribute: function(activate) {
            var attr1 = activate ? 'data-pjaxbackup' : 'data-pjax-mojit',
                attr2 = activate ? 'data-pjax-mojit' : 'data-pjaxbackup';
            this.allAnchor.each(
                function(node) {
                    var datapjaxmojit = node.getAttribute(attr1);
                    if (datapjaxmojit) {
                        node.setAttribute(attr2, datapjaxmojit);
                        node.removeAttribute(attr1);
                    }
                }
            );
        },

        /**
         * The binder method, invoked to allow the mojit to attach DOM event
         * handlers.
         *
         * @param node {Node} The DOM node to which this mojit is attached.
         */
        bind: function(node) {
            var instance = this,
                pjaxselectionCont = Y.one('.pjaxselection'),
                pjaxselectionButtons = pjaxselectionCont.all('button');

            pjaxselectionCont.delegate(
                'click',
                function(e) {
                    var btn = e.currentTarget,
                        pjaxtype;
                    pjaxselectionButtons.removeClass(PURE_BUTTON_ACTIVE);
                    btn.addClass(PURE_BUTTON_ACTIVE);
                    pjaxtype = btn.getAttribute('data-pjaxtype');
                    switch (pjaxtype) {
                        case '0':
                            instance.switchAttribute(false);
                        break;
                        case '1':
                            instance.switchAttribute(true);
                            instance.allAnchor.removeAttribute('data-pjax-cache');
                        break;
                        case '2':
                            instance.switchAttribute(true);
                            instance.allAnchor.setAttribute('data-pjax-cache', true);
                        break;
                    }
                    Y.soon(Y.bind(instance.refreshCodedescription, instance));
                },
                'button'
            );
        }

    };

}, '0.0.1', {requires: ['mojito-client', 'node-event-delegate', 'event', 'itsa-mojitonthefly']});
