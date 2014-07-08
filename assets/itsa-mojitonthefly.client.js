
/*jshint maxlen:200 */

/*
 *
 * <i>Copyright (c) 2014 Marco Asbreuk - http://itsasbreuk.nl</i>
 * YUI BSD License - http://developer.yahoo.com/yui/license.html
 *
*/

YUI.add('itsa-mojitonthefly', function(Y) {
'use strict';

    var MIME_JSON = 'application/json',
        PURE_MENU_SELECTED = 'pure-menu-selected',
        toArray = Y.Array,
        YObject = Y.Object,
        EVT_PJAX = 'pjax',
        body = Y.one('body'),
        head = Y.one('head'),
        DEFAULT_UNSPECIFIED_CACHETIME = 3600, // 1 hour
        DATE_ADD_SECONDS = function(oDate, seconds) {
            oDate.setTime(oDate.getTime()+(1000*seconds));
        },
        _render,
        UA = Y.UA,
        win = Y.config.win,
        doc = Y.config.doc,
        mojitlist = {},
        Notifier,
        // All HTML5-capable browsers except Gecko 2+ (Firefox 4+) correctly return
        // true for 'onpopstate' in win. In order to support Gecko 2, we fall back to a
        // UA sniff for now. (current as of Firefox 4.0b2)
        SUPPORTS_HISTORY_HTML5 = !!(win.history && win.history.pushState && win.history.replaceState && ('onpopstate' in win || UA.gecko >= 2) && (!UA.android || UA.android >= 2.4)),
        REGEXP_FIND_URI = new RegExp("^([a-z][a-z0-9+\\-.]*:(\\/\\/[^\/?#]+)?)?(\\/?[a-z0-9\\-._~%!$&'()*+,;=@]+(\\/[a-z0-9\\-._~%!$&'()*+,;=:@]+)*\\/?|\\/)([#?]|$)", "i");

    /* ********************************************************************************************************
     *
     *  Y.Promise.EventNotifier is derived from SmugMugs gallery-sm-promise-eventshttps://github.com/smugmug/yui-gallery/tree/master/src/sm-promise-events
     *  Copyright (c) 2013 SmugMug, Inc.
     *
     **********************************************************************************************************/

    /**
    Provides a `Y.Promise.EventNotifier` class. Instances can be used to decorate
    `Y.Promise` instances with an `on()` method to allow for non-resolution related
    event notifications such as cancelation or progress. Additionally, the
    promise's `then` method is "infected" to propagate the mixin to its returned
    promises as well, allowing notifications to cascade throughout a promise chain.

    @module gallery-sm-promise-events
    @since @@SINCE@@
    **/

    /**
    @namespace Promise
    @class EventNotifier
    @constructor
    **/
    Notifier = Y.Promise.EventNotifier = function () {
        this._targets = [];
    };

    /**
    Decorate a Promise with an `on` method and make its `then` method propagate
    event support to its generated child promises.

    @method decorate
    @param {Promise} promise the Promise to add event support to
    @static
    **/
    Notifier.decorate = function (promise) {
        if (promise._evts) {
            return promise;
        }

        promise._evts = {
            subs   : {},
            targets: []
        };

        promise.on = function (type, callback) {
            if (type && callback) {
                if (!promise._evts.subs[type]) {
                    promise._evts.subs[type] = [];
                }

                promise._evts.subs[type].push(callback);
            }

            return promise;
        };

        promise.then = (function (original) {
            return function (ok, fail) {
                var child = Notifier.decorate(original.call(this, ok, fail));

                this._evts.targets.push(child);

                return child;
            };
        })(promise.then);

        return promise;
    };

    Y.mix(Notifier.prototype, {
        /**
        Decorate a promise and register it and its kin as targets for notifications
        from this instance.

        Returns the input promise.

        @method addEvents
        @param {Promise} promise The Promise to add event support to
        @return {Promise}
        **/
        addEvents: function (promise) {
            var targets = this._targets;
            targets.push(promise);
            promise['catch'](
                function() {
                    return true;
                }
            ).then(
                function() {
                    targets.splice(targets.indexOf(promise), 1);
                }
            );
            return Notifier.decorate(promise);
        },

        /**
        Notify registered Promises and their children of an event. Subscription
        callbacks will be passed additional _args_ parameters.

        @method fire
        @param {String} type The name of the event to notify subscribers of
        @param {Any*} [args*] Arguments to pass to the callbacks
        @return {Promise.EventNotifier} this instance
        @chainable
        **/
        fire: function (type) {
            var targets = this._targets.slice(),
                known   = {},
                args    = arguments.length > 1 && toArray(arguments, 1, true),
                target, subs,
                i, j, jlen, guid, callback;

            // Add index 0 and 1 entries for use in Y.bind.apply(Y, args) below.
            // Index 0 will be set to the callback, and index 1 will be left as null
            // resulting in Y.bind.apply(Y, [callback, null, arg0,...argN])
            if (args) {
                args.unshift(null, null);
            }

            // Breadth-first notification order, mimicking resolution order
            // Note: Not caching a length comparator because this pushes to the end
            // of the targets array as it iterates.
            for (i = 0; i < targets.length; ++i) {
                target = targets[i];

                if (targets[i]._evts) {
                    // Not that this should ever happen, but don't push known
                    // promise targets onto the list again. That would make for an
                    // infinite loop
                    guid = Y.stamp(targets[i]);

                    if (known[guid]) {
                        continue;
                    }

                    known[guid] = 1;

                    // Queue any child promises to get notified
                    targets.push.apply(targets, targets[i]._evts.targets);

                    // Notify subscribers
                    subs = target._evts.subs[type];

                    if (subs) {
                        for (j = 0, jlen = subs.length; j < jlen; ++j) {
                            callback = subs[j];

                            if (args) {
                                args[0]  = callback;
                                callback = Y.bind.apply(Y, args);
                            }

                            // Force async to mimic resolution lifecycle, and
                            // each callback in its own event loop turn to
                            // avoid swallowing errors and errors breaking the
                            // current js thread.
                            // TODO: would synchronous notifications be better?
                            Y.soon(callback);
                        }
                    }
                }
            }

            return this;
        }
    });

    /* ********************************************************************************************************
     *
     *  Y.io.getJSON is derived from Juan Dopazo's gallery-io-utils https://github.com/juandopazo/yui3-io-utils
     *  Copyright (c) 2013, Juan Ignacio Dopazo All rights reserved.
     *
     **********************************************************************************************************/

    /**
    Method for initiating an ajax call.

    @method xhr
    @for io
    @static
    @param {String} uri Qualified path to transaction resource.
    @param {Object} [options] Configuration object for the transaction.
    @param {String} [options.method=GET] HTTP method verb (e.g., GET or POST).
    @param {Object|String} [options.data] This is the name-value string that will be
        sent as the transaction data. If the request is HTTP GET, the data become
        part of querystring. If HTTP POST, the data are sent in the message body.
    @param {Object} [options.form] Form serialization configuration object. Its properties
        are:
        * `id` node object or id of HTML form
        * `useDisabled` true to also serialize disabled form field values (defaults
            to false)
    @param {Object} [options.headers] Object map of transaction headers to send to
        the server. The object keys are the header names and the values are the
        header values.
    @param {Number} [options.timeout] Millisecond threshold for the transaction
        before being automatically aborted.
    @return {Promise} Promise for the response object. Contains an extra
        `abort()` method to cancel the request.
    **/
    Y.io.xhr = function (uri, options) {
        options = options || {};

        return new Y.Promise(function (resolve, reject) {
            var io = Y.io(uri, {
                // reference options directly to avoid insertion of unwanted options
                // into Y.io()
                method: options.method,
                data: options.data,
                headers: options.headers,
                form: options.form,
                timeout: options.timeout,
                on: {
                    success: function (id, response) {
                        resolve(response);
                    },
                    failure: function (id, response) {
                        reject(response);
                    }
                }
            });

            // expose abort. It is not a prototype function so it's ok to copy it
            this.abort = io.abort;
        });
    };

    /**
    Performs an AJAX request and parses the response as JSON notation.
    Requires the JSON module.

    @method json
    @for io
    @static
    @param {String} uri Qualified path to transaction resource.
    @param {Object} [options] Same configuration options as Y.io.xhr() with an extra
                    `reviver` option which is a reviver function for the `JSON.parse`
                    algorithm.
    @return {Promise} Promise for the response object. Contains an extra
        `abort()` method to cancel the request.
    **/
    Y.io.json = function (uri, options) {
        options = options || {};

        // Force the use of the correct headers
        // Since a JSON response is expected, ask for it with the Accept header
        if (!options.headers) {
            options.headers = {};
        }
        options.headers.Accept = MIME_JSON;

        var promise = Y.io.xhr(uri, options);

        return Y.mix(promise.then(function (xhr) {
            return Y.JSON.parse(xhr.responseText, options.reviver);
        }), {
            // pass around the abort function
            abort: promise.abort
        });
    };

    /**
    Performs an AJAX request with the GET HTTP method and parses the response as
    JSON notation. Requires the JSON module.

    @method getJSON
    @for io
    @static
    @param {String} uri Qualified path to transaction resource.
    @param {Object} [options] Same configuration options as Y.io.json()
    @return {Promise} Promise for the response object. Contains an extra
        `abort()` method to cancel the request.
    **/
    Y.io.getJSON = function (uri, options) {
        options = options || {};
        options.method = 'GET';
        return Y.io.json(uri, options);
    };

    /* ********************************************************************************************************
     *
     * WHAT FOLLOWS NEXT IS THE CODE THAT DOES THE REAL MOJIT-ON-THE-FLY
     * Copyright (c) 2014, It's Asbreuk All rights reserved.
     *
     **********************************************************************************************************/

    /**
     * Renderes the view inside the viewnode.
     * When it's the first time the view is rendered, all assets will be inserted in the Dom as well.
     *
     * @method _render
     * @param response {Object} serverresponse containing Mojit-data
     * @param response.view {String}
     * @param response.binders {Object}
     * @param [response.assets] {Object}
     * @param container {Y.Node} view's parentNode: where the view should be inserted as innerHTML
     * @param cachabletime {number} seconds to cache the view
     * @param renderedbefore {boolean} flag that tells if the view was rendered before
     * @param cssrenderedbefore {boolean} flag that tells if the view's css was already inserted in the Dom
     * @return {Promise} Promise with information about the inserted view
     * @private
     * @protected
     *
    **/
    _render = function(response, container, cachabletime, renderedbefore, cssrenderedbefore) {
        var assets = response.assets,
            assetstop = assets && assets.top,
            assetsbottom = assets && assets.bottom,
            topCSS = (assetstop && assetstop.css) || [],
            bottomCSS = (assetsbottom && assetsbottom.css) || [],
            topJS = (assetstop && assetstop.js) || [],
            bottomJS = (assetsbottom && assetsbottom.js) || [],
            topBLOB = (assetstop && assetstop.blob) || [],
            bottomBLOB = (assetsbottom && assetsbottom.blob) || [],
            mojitoClient = win.YMojito.client,
            loadlistBefore, loadlistAfter, lastBodyNode, bodychildren, insertView, newnode, unbindMojits, returnObject, expire;

        newnode = Y.Node.create(response.view);
        unbindMojits = function(cont) {
            YObject.each(
                mojitoClient._mojits,
                function(value, key) {
                    // if the viewnode is inside the container --> destroy the mojit
                    if (cont.one('#'+key)) {
/*jshint expr:true */
                        value.proxy._binder && value.proxy._binder.destructor && value.proxy._binder.destructor();
/*jshint expr:false */
                        mojitoClient.destroyMojitProxy(key, false);
                    }
                }
            );
        };
        insertView = function() {
            // be careful: setHTML will "just" erase the dom-node, which doesn't call unbind for Mojits that lie inside!
            // so we need to check for all present mojits if they lie underneath and need to unbind!
            unbindMojits(container);
            // next, we also need to make sure to cleanup the container, beacuse setHTML() remains Node-instances
            container.empty();
            // now we can set the new content:
            container.setHTML(newnode);
            toArray.each(
                bottomBLOB,
                function(blobrecord) {
                    body.append(blobrecord+'\n');
                }
            );
/*jshint expr:true */
            response.binders && mojitoClient.attachBinders(response.binders);
            loadlistAfter && (loadlistAfter.length>0) && Y.Get.load(loadlistAfter, {insertBefore: lastBodyNode});
/*jshint expr:false */
        };
        if (!renderedbefore) {
            if ((bottomCSS.length+bottomJS.length+bottomBLOB.length)>0) {
                bodychildren = body.get('children');
                lastBodyNode = bodychildren.item(bodychildren.size()-1);
            }
            loadlistBefore = cssrenderedbefore ? topJS : topCSS.concat(topJS);
            loadlistAfter = cssrenderedbefore ? bottomJS : bottomCSS.concat(bottomJS);
            toArray.each(
                topBLOB,
                function(blobrecord) {
                    head.append(blobrecord+'\n');
                }
            );
            if (loadlistBefore.length>0) {
                Y.Get.load(loadlistBefore, insertView);
            }
            else {
                insertView();
            }
        }
        else {
            insertView();
        }
        returnObject = {
            viewId: newnode.get('id'),
            containerNode: container,
            title: response.title
        };
        if (cachabletime) {
            expire = new Date();
            DATE_ADD_SECONDS(expire, cachabletime);
            returnObject.view = response.view;
            returnObject.binders = response.binders;
            returnObject.expire = expire;

        }
        return Y.Promise.resolve(returnObject);
    };

    /* ********************************************************************************************************/

    /**
     * Loads a Mojit from the server and inserts it into the Node.
     * The Node acts as a parentNode of the Mojit.
     *
     * @method loadMojit
     * @param mojit {String} the Mojit to be loaded
     * @param [action='index'] {String} the action to be invoked on the Mojit
     *
    **/
    Y.Node.prototype.loadMojit = function(mojit, action) {
        var nodeinstance = this,
            loadedBefore = mojitlist[mojit],
            headers = {
                'M-FLY-MOJIT': mojit
            },
            uri, extractedURI, promise, jsonPromise;
/*jshint expr:true */
        action && (headers['M-FLY-ACTION']=action);
        loadedBefore || (headers['M-FLY-FULL']=true);
/*jshint expr:false */
        extractedURI = win.location.href.match(REGEXP_FIND_URI);
        uri = extractedURI[1];

        // if transaction before, abort is if needed
/*jshint expr:true */
        nodeinstance._loadMojitTransaction && nodeinstance._loadMojitTransaction.abort();
/*jshint expr:false */

        jsonPromise = Y.io.getJSON(uri, {headers: headers});
        nodeinstance._loadMojitTransaction = promise = Y.mix(jsonPromise.then(
            function(response) {
                mojitlist[mojit] = true;
                return _render(response, nodeinstance, null, loadedBefore, false);
            }
        ), {
            // pass around the abort function
            abort: jsonPromise.abort
        });
        return promise;
    };

    /**
     * Loads a Mojit from the server and inserts it into the Node.
     * The Node acts as a parentNode of the Mojit.
     *
     * @method loadMojit
     * @param mojit {String} the Mojit to be loaded
     * @param [action='index'] {String} the action to be invoked on the Mojit
     *
    **/

    Y.namespace('mojito').pjax = (function() {
        var loadedpages = {},
            history, initialize, bind, defaultContainer, defaultCacheTime, saveHistory,
            setSelectedMenu, doPjax, preload, getCachabletime, defFnLoadPage, extractedURI, pjaxnotifier;

        /**
         *
         * Performs the initialisation for the Pjax-functionality.
         * Runs only once.
         *
         * @method initialize
         * @protected
         *
        **/
        initialize = function() {
            var initialuri, initialstateNode;
            if (SUPPORTS_HISTORY_HTML5) {
                extractedURI = win.location.href.match(REGEXP_FIND_URI);
                initialuri = extractedURI[3]; // third item is the path
                initialstateNode = Y.one('a[data-pjax-initialstate="true"]');
                Y.publish(
                    EVT_PJAX,
                    {
                        defaultFn: defFnLoadPage,
                        emitFacade: true
                    }
                );

                history = new Y.HistoryHTML5();
                // save current uri
/*jshint expr:true */
                initialstateNode && saveHistory(initialuri, doc.title, initialstateNode, true);
/*jshint expr:false */
                // to be able to cancel transactions in case of anothr pjax-call during previous transaction, we include
                // Y.Promise.EventNotifier --> https://github.com/smugmug/yui-gallery/tree/master/src/sm-promise-events
                pjaxnotifier = new Y.Promise.EventNotifier();

                bind();

                // inspects the anchorelements after 60 sec. for selector: 'a[data-pjax-preload], a[data-pjax-initialstate="true"]'
                // we delay because we want other processes to be prefered. After all, preload is meant to be a cache for future requests
                Y.later(60, null, preload, initialuri);
            }
        };

        /**
         * Re-sets the selected menu-item (classname 'pure-menu-selected') on the li-node.
         * Alsp erases this classname on all other li-nodes of the menu (specified by puremenu)
         *
         * @method setSelectedMenu
         * @param puremenu {Y.Node} may be the ul-element, or its parent div.
         * @param linode {Y.Node} the li-node that should have the 'pure-menu-selected'-class
         * @protected
         *
        **/
        setSelectedMenu = function(puremenu, linode) {
            puremenu.all('li').removeClass(PURE_MENU_SELECTED);
            linode.addClass(PURE_MENU_SELECTED);
        };

        /**
         * Replaces or adds a new history-entry.
         *
         * @method saveHistory
         * @param uri {String} browsers uri
         * @param title {String} browsers title
         * @param targetnode {Y.Node} the anchor-node that was clicked
         * @param replace {boolean} whether the entry should be replaced
         * @protected
         *
        **/
        saveHistory = function(uri, title, targetnode, replace) {
/*jshint expr:true */
            targetnode.get('id') || targetnode.set('id', Y.guid());
            if (replace) {
                history.replace({uri: uri, targetid: targetnode.get('id')}, {url: uri, title: title});
            }
            else {
                (history.get('uri')===uri) || history.add({
                    uri: uri,
                    targetid: targetnode.get('id'),
                    xpos: win.pageXOffset || doc.documentElement.scrollLeft,
                    ypos: win.pageYOffset || doc.documentElement.scrollTop
                },
                {
                    url: uri,
                    title: title
                });
            }
/*jshint expr:false */
        };

        /**
         * Performs a Pjax preload on all elements with the selector: 'a[data-pjax-preload]' or 'a[data-pjax-initialstate="true"]'
         *
         * @method preload
         * @param initialuri {String} the current browseruri, which is needed because the current uri shouldn't re-insert its assets
         * @protected
         *
        **/
        preload = function(initialuri) {
            body.all('a[data-pjax-preload], a[data-pjax-initialstate="true"]').each(
                function(anchornode) {
                    var uri = anchornode.getAttribute('href');
                    doPjax(anchornode, uri, getCachabletime(anchornode, true), uri===initialuri, true, true, false);
                }
            );
        };

        /**
         * Determines the cachabletime of the li-Node specified.
         * The cachable time may be set by the li-node's attribute 'data-pjax-cache', or otherwise 'defaultCacheTime' is used
         * If 'defaultCacheTime' is not specified, this method returns falsy
         *
         * @method getCachabletime
         * @param node {Y.Node}
         * @param preload {boolean}
         * @protected
         * @return {number|undefined} cachable time in seconds, or falsy (meaning: not cachable)
         *
        **/
        getCachabletime = function(node, preload) {
            var preloadtime = node.getAttribute('data-pjax-preload'),
                cachabletime;
            if (preload) {
                cachabletime = (preloadtime==='true') ? DEFAULT_UNSPECIFIED_CACHETIME : preloadtime;
            }
            else {
/*jshint expr:true */
                cachabletime = node.getAttribute('data-pjax-cache') || defaultCacheTime || preloadtime;
                (cachabletime==='true') && (cachabletime=DEFAULT_UNSPECIFIED_CACHETIME);
/*jshint expr:false */
            }
            return cachabletime;
        };

        /**
         *
         * Sets the binders for historychange and click-events for all 'a[data-pjax-mojit]' elements.
         *
         * @method bind
         * @protected
         *
        **/
        bind = function() {
            Y.on('history:change', function(e) {
                var newVal = e.newVal,
                    popstate = (e.src==='popstate'),
                    uri = newVal.uri,
                    targetid = newVal.targetid,
                    targetnode = popstate && targetid && Y.one('#'+targetid);
                if (targetnode && uri) {
                    Y.fire(EVT_PJAX, {uri: uri, targetnode: targetnode, fromhistorychange: true, xpos: newVal.xpos, ypos: newVal.ypos});
                }
            });
            body.delegate(
                ['tap', 'click'],
                function(e) {
                    var targetnode = e.currentTarget;
                    if (e.type==='click') {
                        e.preventDefault();
                    }
                    else {
                       /**
                         * Event fired whenever there is a click on an anchor-element with the attribute '[data-pjax-mojit]'
                         * Is preventable.
                         *
                         * @event pjax
                         * @param e {EventFacade} Event Facade including:
                         * @param e.uri {String} href that should be called
                         * @param e.targetnode {Y.Node} The anchor-node that was clicked
                         * @param e.fromhistorychange {boolean} The ButtonNode that was clicked
                         *
                        */
                        Y.fire(EVT_PJAX, {uri: targetnode.getAttribute('href'), targetnode: targetnode, fromhistorychange: false});
                    }
                },
                'a[data-pjax-mojit]'
            );
        };

        /**
         *
         * Default function for the pjax-event.
         * Loads the Mojit-data as a json-object and inserts in into the specified container
         * (which is defined by the anchor-attribute 'data-pjax-container', or set through Y.mojito.pjax.setContainer()).
         *
         * Depending on its state and params, the viewdata might be loaded from cache, mojit.refreshView or a complete new serverload.
         *
         * @method defFnLoadPage
         * @param e {Object}
         * @param e.uri {String} href that should be called
         * @param e.targetnode {Y.Node} The anchor-node that was clicked
         * @param e.fromhistorychange {boolean} The ButtonNode that was clicked
         * @protected
         *
        **/
        defFnLoadPage = function(e) {
            var uri = e.uri,
                targetnode = e.targetnode,
                fromhistorychange = e.fromhistorychange,
                mojit, cachabletime, loadedpagesuri, expiretime, puremenu, linode;
            if (fromhistorychange) {
                targetnode.focus();
                win.scrollTo(e.xpos, e.ypos);
            }
            linode = targetnode.get('parentNode');
            puremenu = linode.get('parentNode').get('parentNode');
/*jshint expr:true */
            puremenu.hasClass('pure-menu') && setSelectedMenu(puremenu, linode);
/*jshint expr:false */
            loadedpagesuri = loadedpages[uri];
            cachabletime = getCachabletime(targetnode);
            // first check if we can retreive from cache:
            if (loadedpagesuri) {
                loadedpagesuri.then(
                    function(loadedpagesuriData) {
                        if (loadedpagesuriData.expire && loadedpagesuriData.expire.getTime()>Date.now()) {
                            pjaxnotifier.fire('cancel', {container: loadedpagesuriData.containerNode});
                            // retrieve from cache
                            // but before we do this: backup the expiretime and reset this afterwards --> rerender from cache shouldn't reset the cachetime
                            expiretime = loadedpagesuriData.expire.getTime();
                            loadedpages[uri] = loadedpagesuriData.preload ?
                                               _render(loadedpagesuriData.response, loadedpagesuriData.containerNode, cachabletime, false, true) :
                                               _render({view: loadedpagesuriData.view, binders: loadedpagesuriData.binders,
                                                        title: loadedpagesuriData.title}, loadedpagesuriData.containerNode, cachabletime, true, false);
                            // now reset the expiretime
/*jshint expr:true */
                            loadedpages[uri].expire && loadedpages[uri].expire.setTime(expiretime);
                            fromhistorychange || saveHistory(uri, loadedpagesuriData.title, targetnode);
/*jshint expr:false */
                        }
                        else if (Y.one('#'+loadedpagesuriData.viewId)) {
                            pjaxnotifier.fire('cancel', {container: loadedpagesuriData.containerNode});
                            mojit = win.YMojito.client._mojits[loadedpagesuriData.viewId];
/*jshint expr:true */
                            mojit && mojit.proxy.refreshView();
/*jshint expr:false */
                            // also reset the timer if needed
                            if (loadedpagesuriData.expire) {
                                loadedpagesuriData.expire = new Date();
                                DATE_ADD_SECONDS(loadedpagesuriData.expire, cachabletime);
                            }
/*jshint expr:true */
                            fromhistorychange || saveHistory(uri, loadedpagesuriData.title, targetnode);
/*jshint expr:false */
                        }
                        else {
                            doPjax(targetnode, uri, cachabletime, loadedpagesuriData.preload ? false : true, false, fromhistorychange, loadedpagesuriData.preload);
                        }
                    },
                    function() {
                        doPjax(targetnode, uri, cachabletime, false, false, fromhistorychange);
                    }
                );
            }
            else {
                doPjax(targetnode, uri, cachabletime, false, false, fromhistorychange);
            }
        };

        /**
         * Performs the serverinvocation. Will load the Mojit-data as json, and either insert it into the Dom or cache ther result for later.
         *
         * @method doPjax
         * @param targetnode {Y.Node} anchor-node that holds information about the mojit and its action
         * @param uri {String} uri that should have been loaded when not loading through Pjax (href-value)
         * @param cachabletime {number} seconds that the view should be cached
         * @param renderedbefore {boolean} whether the view was rendered before
         * @param preload {boolean} if the Mojitdata should only be preloaded
         * @param nosavehistory {boolean} if the invokcation should be done without saving the history-state (only when called through the browsers back-forward buttons)
         * @param ispreloaded {boolean} if the Mojits value is preloaded
         * @protected
         *
        **/
        doPjax = function(targetnode, uri, cachabletime, renderedbefore, preload, nosavehistory, ispreloaded) {
            var pjaxcontainer = targetnode.getAttribute('data-pjax-container'),
                container = (pjaxcontainer && Y.one(pjaxcontainer)) || defaultContainer || body,
                i = 0,
                loadmojit, loadaction, headers, jsonPromise, parheader;

            loadmojit = targetnode.getAttribute('data-pjax-mojit');
            loadaction = targetnode.getAttribute('data-pjax-action');
            headers = {'M-PJAX': true};
/*jshint boss:true */
            while (parheader=targetnode.getAttribute('data-pjax-par'+(++i))) {
                headers['M-PJAX-PAR'+i] = parheader;
            }
/*jshint boss:false */
/*jshint expr:true */
            loadmojit && (headers['M-PJAX-MOJIT']=loadmojit);
            loadaction && (headers['M-PJAX-ACTION']=loadaction);
            renderedbefore || (headers['M-PJAX-FULL']=true);
            preload || pjaxnotifier.fire('cancel', {container: container});
            jsonPromise = Y.io.getJSON(uri, {headers: headers});
            // first save history with current title
            nosavehistory || saveHistory(uri, doc.title, targetnode);
/*jshint expr:false */
            jsonPromise.then(
                function(response) {
                    var expire, returnObject, assets, topCSS, bottomCSS, bodychildren, lastBodyNode;
                    // now replace history with the known title
/*jshint expr:true */
                    nosavehistory || saveHistory(uri, response.title, targetnode, true);
/*jshint expr:false */
                    if (preload) {
                        assets = response.assets;
                        topCSS = (assets && assets.top && assets.top.css) || [];
                        bottomCSS = (assets && assets.bottom && assets.bottom.css) || [];
/*jshint expr:true */
                        (topCSS.length>0) && Y.Get.load(topCSS);
/*jshint expr:false */
                        if (bottomCSS.length>0) {
                            bodychildren = body.get('children');
                            lastBodyNode = bodychildren.item(bodychildren.size()-1);
                            Y.Get.load(bottomCSS, {insertBefore: lastBodyNode});
                        }
                        returnObject = {
                            response: response,
                            containerNode: container,
                            preload: true
                        };
                        if (cachabletime) {
                            expire = new Date();
                            DATE_ADD_SECONDS(expire, cachabletime);
                            returnObject.expire = expire;
                        }
                        loadedpages[uri] = Y.Promise.resolve(returnObject);
                    }
                    else {
                        loadedpages[uri] = _render(response, container, cachabletime, renderedbefore, ispreloaded);
                    }
                }
            );
            jsonPromise.preload = preload;
            jsonPromise.container = container;
            // add the promise to the eventnotifier, to be able to reject when needed:
            pjaxnotifier.addEvents(jsonPromise);
            jsonPromise.on('cancel', function (e) {
                var promise = jsonPromise;
/*jshint expr:true */
                promise.preload || (promise.container!==e.container) || promise.abort();
/*jshint expr:false */
            });
        };

        // now run the initialiser:
        initialize();

        // return the object, so that only 5 methods are accessable:
        return {
            /**
             * Sets the default container (parentNode) where the Mojit's views should be inserted.
             *
             * @method Y.mojito.pjax.setContainer
             * @param container {Y.Node}
             *
            **/
            setContainer: function(container) {
                defaultContainer = container;
            },
            /**
             * Sets the default cachetime in seconds.
             *
             * @method Y.mojito.pjax.setCacheTime
             * @param sec {number}
             *
            **/
            setCacheTime: function(sec) {
/*jshint expr:true */
                (typeof sec==='number') && (defaultCacheTime = sec);
/*jshint expr:false */
            },
            /**
             *
             * Empties the cache with views. Actually it not empties the cache but forces to recache the view.
             *
             * @method Y.mojito.pjax.emptyCache
             *
            **/
            emptyCache: function() {
                var pasttime = Date.now()-1;
                YObject.each(
                    loadedpages,
                    function(value) {
                        var promise = value;
                        promise.then(
                            function(loadedpagesuriData) {
                                loadedpagesuriData.expire = pasttime; // force re-cache
                            }
                        );
                    }
                );
            },
            /**
             * Whether Pjax-functionality is supported on this browser.
             *
             * @method Y.mojito.pjax.pjaxAvailable
             *
            **/
            pjaxAvailable: function() {
                return SUPPORTS_HISTORY_HTML5;
            },
            /**
             * Simulates an achorclick on a Pjax-link-element.
             *
             * @method Y.mojito.pjax.simulateAnchorClick
             * @param anchornode {Y.Node} the node on which the click should be simulated
             *
            **/
            simulateAnchorClick: function(anchornode) {
                var valid =  (anchornode.get('tagName')==='A') && anchornode.getAttribute('data-pjax-mojit');
/*jshint expr:true */
                valid && Y.fire(EVT_PJAX, {uri: anchornode.getAttribute('href'), targetnode: anchornode, fromhistorychange: false});
/*jshint expr:false */
            }
        };
    })();


}, '0.0.1', {requires: ['node-base', 'promise', 'node-event-delegate', 'history-html5', 'event-tap', 'get', 'io-base', 'json-parse']});
