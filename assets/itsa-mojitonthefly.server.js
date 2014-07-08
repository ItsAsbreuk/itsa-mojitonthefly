/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true*/

/**

Given a `command`, dispatches it to the Mojito engine.

@module mojito
@submodule dispatcher
**/

"use strict";
var libdispatcher = require('../../mojito/lib/dispatcher'),
    dispatchedDynamicMojit = libdispatcher.dispatch('@itsa-mojitonthefly.index');

module.exports = {

    /**
     *
     * re-definition of libmojito's libdispatcher.handleRequest
     * before calling the original libdispatcher.handleRequest, the request is inspected for the headers:
     * 'M-PJAX' and 'M-FLY-MOJIT'.
     * If found, the an alternative Mojit is invoked: '@itsa-mojitonthefly.index', passing the original
     * Mojit and action as params, together with the param 'flyfull' (derived from the header 'M-FLY-FULL'),
     * which tells whether to return assets as well.
     *
     * '@itsa-mojitonthefly.index' will return the original Mojit+action as a json-object.
     *
     * @method extend
     * @param app {Object} the original app-instance
     * @param libmojito {Object} libmojito-instance
     * @since 0.1
     *
     */
    extend: function(app, libmojito) {
        libdispatcher.OLDhandleRequest = libdispatcher.handleRequest;

        // before anything gets dispatched, we need to redefine libmojito.dispatch
        // also redefine its alias 'dispatcher'
        libmojito.dispatcher = libmojito.dispatch = function(call, params) {
            return libdispatcher.dispatch(call, params);
        };


        libdispatcher.handleRequest = function(req, res, next) {
            var i, par;
            if (!req.header('M-PJAX') || (req.params && req.params.pjax)) {
                // we ALSO looked at req.params.pjax to prevent looping!
                // in case req.params.pjax===true, the mojit already is replaced
                return libdispatcher.OLDhandleRequest(req, res, next);
            }
            // first set param that determines to return a full response, or just a view
            req.params || (req.params={});
            i = 0;
            while (par=req.header('M-PJAX-PAR'+(++i))) {
                req.params[i-1] = par;
            }
            // libmojito.dispatch should know we come from pjax:
            req.params.pjax = true;
            // now add additional parameters to be handled by @Dynamic.index
            req.params.flyfull = req.header('M-PJAX-FULL');
            // req.command.instance.base --> in case of reference instead of @Mojit
            req.params.flymojit = req.header('M-PJAX-MOJIT') || req.command.instance.type;
            req.params.flyaction = req.header('M-PJAX-ACTION') || req.command.action;

            // now we create a pjax-call
            dispatchedDynamicMojit(req, res, next);
        };

        // also create a middleware that interrups when a dynamic mojit is called withou PJAX:
        app.use(function (req, res, next) {
            if (!req.header('M-FLY-MOJIT')) {
                next();
                return;
            }
            req.params || (req.params={});
            // now add additional parameters to be handled by @Dynamic.index
            req.params.flyfull = req.header('M-FLY-FULL');
            req.params.flymojit = req.header('M-FLY-MOJIT');
            req.params.flyaction = req.header('M-FLY-ACTION') || 'index';
            dispatchedDynamicMojit(req, res, next);
        });

    }
};