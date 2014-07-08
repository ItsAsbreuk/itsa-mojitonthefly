/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('itsa-mojitonthefly', function(Y, NAME) {

/**
 * This mojit is called whenever the middleware is re-routing the request.
 * This happens whenever 'M-FLY-MOJIT' or 'M-PJAX' is part of the header.
 *
 * The Mojit that should be invoked is passed as the param: 'flymojit', but this Mojit is invoked.
 * 
 * This Mojit does a composition of the original mojit, but returns a json-object.
 * If the param "flyfull" equals true, the assets will be part of the json-object.
 *
 * @module itsa-mojitonthefly
 */
    var ERROR_NO_MOJIT = '<b>ERROR: You need to specify a <u>child-Mojit</u> by settting the attribute <i>data-pjax-mojit="Somemojit"</i> on the anchor-element.</b>',
        ERROR_INVALID_MOJIT = '<b>ERROR: Mojit <i>@{mojit}.{action}</i> does not exist.</b>';
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
            var flymojit = ac.params.getFromRoute('flymojit'),
                flyaction = ac.params.getFromRoute('flyaction'),
                flyfull = ac.params.getFromRoute('flyfull'),
                params = ac.params.getAll(),
                cfg;
            if (!flymojit) {
                ac.done({view: ERROR_NO_MOJIT}, 'json');
                return;
            }
            delete params.route.pjax;
            delete params.route.flymojit;
            delete params.route.flyaction;
            delete params.route.flyfull;
            cfg = {
                children: {
                    original: {
                        type: flymojit,
                        action: flyaction,
                        params: params
                    }
                }
            };
              // The 'meta' object containing metadata about the children's binders, assets,
              // configuration, and HTTP header info is passed to the callback. This 'meta'
              // object is required for binders to execute and attach content to the DOM.
              // we strip it ans pass it as the data-object
            ac.composite.execute(cfg, function(data, fragments) {
                var view = data.original;
                if (view==='') {
                    view = Y.Lang.sub(ERROR_INVALID_MOJIT, {mojit: flymojit, action: flyaction});
                }
                if (!flyfull) {
                    ac.done({view: view, binders: fragments.binders}, 'json');
                    return;
                }
                delete fragments.children;
                delete fragments.http;
                fragments.view = view;
                /*
                now fragment is an object that looks like:
                {
                    assets: {
                        bottom: {
                            js: [
                                'someUri',
                                'someUri'
                            ],
                            css: [
                                'someUri',
                                'someUri'
                            ]
                        },
                        top: {
                            js: [
                                'someUri',
                                'someUri'
                            ],
                            css: [
                                'someUri',
                                'someUri'
                            ]
                        }
                    },
                    view: 'rendered Mojit-view',
                    binders: {
                        someviewid: {
                            name: 'binder-module-name',
                            action: 'index',
                            type: 'Home',
                            viewId: 'yui_3_etc',
                            instanceId: 'yui_3_etc'
                        },
                        someviewid: {
                            name: 'binder-module-name',
                            action: 'index',
                            type: 'Home',
                            viewId: 'yui_3_etc',
                            instanceId: 'yui_3_etc'
                        }
                    }
                }
                */
                ac.done(fragments, 'json');
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-params-addon', 'mojito-composite-addon']});
