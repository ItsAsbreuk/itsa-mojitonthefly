Mojit On The Fly
==================

This is a utility for [Mojito](https://developer.yahoo.com/cocktails/mojito/) providing clientside
`Y.Node.loadMojit()` and `Pjax`-functionality. Using these methods,
Mojito will return a json-object that is handled by these
methods and inserted into the specified containernodes.

The Mojit instances are executed 'on the fly',
no need for a predefinition in application.json.


Installation
------------

Install the `npm` package in your application folder:

```shell
$ cd path/to/app
$ npm install itsa-mojitonthefly-addon --save
```

_note: the `--save` flag indicates that the `package.json` for
the application should also register the `itsa-mojitonthefly-addon` as
a dependency._

Step 1:
-------

Once `itsa-mojitonthefly-addon` is installed in your application, you
must add its functionality inside `app.js`, by defining the statement:
_mojitOnthefly.extend(app, libmojito)_.
`example app.js:`

```js
var express = require('express'),
    libmojito = require('mojito'),
    mojitOnthefly = require('itsa-mojitonthefly-addon'),
    app;

app = express();
app.set('port', process.env.PORT || 8666);
libmojito.extend(app, {
    context: {
        environment: "development"
    }
});
app.use(libmojito.middleware());

// must be set AFTER app.use(libmojito.middleware());
// and BEFORE the routers
mojitOnthefly.extend(app, libmojito);

app.get('/', libmojito.dispatch('simple.index'));
app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port') + ' ' +
                   'in ' + app.get('env') + ' mode');
});
```

This will add extra middleware that interrupts when the headers
`M-PJAX` or `M-FLY-MOJIT` are found. These headers are generated
on the client by _Y.Node.loadMojit()_ and _Y.mojito.pjax_ (see below).

Step 2:
-------

With the Mojit you want to use _Y.Node.loadMojit()_ or _Pjax-functionality_:
Inside `controller.server.js` --> include the dependency `itsa-mojitonthefly-addon`.

`example controller.server.js:`
```js
YUI.add('navigation', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {
        index: function(ac) {
            ac.done(data);
        }
    };

}, '0.0.1', {requires: ['mojito', 'itsa-mojitonthefly-addon']});
```
This ensures the modulecode will be send to the client.

Step 3a Y.Node.loadMojit():
---------------------------

You can call `Y.Node.loadMojit(mojitname, action)` to make the mojit
execute and loaded inside the parentnode specified.

On the clientside code (inside the binder) make sure to include the
dependency `itsa-mojitonthefly`, otherwise the code might not be ready yet.
_Step 2_ makes sure the modulecode is available on the client.

`example binder:`
```js
YUI.add('home-binder-index', function(Y, NAME) {

    Y.namespace('mojito.binders')[NAME] = {
        init: function(mojitProxy) {
            this.mojitProxy = mojitProxy;
        },

        bind: function(node) {
            this.node = node;
            Y.one('button').on(
                'click',
                function() {
                    Y.one('#container').loadMojit('MojitContact');
                }
            );
        }
    };

}, '0.0.1', {requires: ['mojito-client', 'event', 'itsa-mojitonthefly']});
```

Step 3b Pjax:
-------------

Assuming _Step 2_ is set, you can use Pjax roght out of the box by just defining
the right attributes to the HTML:
```html
<div class="pure-menu pure-menu-open pure-menu-horizontal">
    <ul>
        <li class="pure-menu-selected">
            <a href="/" data-pjax-mojit="Home" data-pjax-container="#cont" data-pjax-initialstate="true">Home</a>
        </li>
        <li>
            <a href="/page1.html" data-pjax-mojit="Page1" data-pjax-container="#cont">Page 1</a>
        </li>
        <li>
            <a href="/page2.html" data-pjax-mojit="Page2" data-pjax-container="#cont">Page 2</a>
        </li>
        <li>
            <a href="/page3.html" data-pjax-mojit="Page3" data-pjax-container="#cont">Page 3</a>
        </li>
    </ul>
</div>
```
The Pjax-utility will automaticly adjust the class `pure-menu-selected` whenever an anchorlink is clicked.
So, if you are using [Purecss](http://purecss.io), everyting works right out of the box.

You can make use of the following attributes:

    * `data-pjax-mojit="Mojit"`
    * `data-pjax-action="action"` --> optional: defaults to "index" when not specified
    * `data-pjax-initialstate="true"` --> optional: define this if the container is initially filled with the Mojit specified, this prevents reloading its assets
    * `data-pjax-cache="true|number"` --> optional: time in seconds to cache the view, leading to quick reload of the mojit. true equals 3600 seconds (1 hour)
    * `data-pjax-preload="true|number"` --> optional: when set, these Mojits are loaded behind the scenes so they appear quick when asked for. the attributes value specifies its cachetime. when set, cachingtime is automaticly: there is no need to define data-pjax-cache as well
    * `data-pjax-container="nodeselector"` --> optional: the parenNode of the view, the view will be inserted as innerHTML --> when not specified, you should use Y.mojito.pjax.setContainer(containernode);
    * `data-pjax-par_n_="somepar"` --> _(n>0)_ optional: adding extra parameters `data-pjax-par1="index.html" the same as when using regexp with app.get();

Optionally, you can make use of `Y.mojito.pjax`, which has several sugar methods.
For instance: _data-pjax-container_ is most likely to be the same node for all anchorlinks.
You can use the API to set the default containernode.

If you choose to use `Y.mojito.pjax` on the clientside code (inside the binder),
make sure to include the dependency `itsa-mojitonthefly`, otherwise the code
might not be ready yet. _Step 2_ makes sure the modulecode is available on the client.

`example binder:`
```js
YUI.add('navigation-binder-index', function(Y, NAME) {

    Y.namespace('mojito.binders')[NAME] = {
        init: function(mojitProxy) {
            var container = Y.one('.container');
            this.mojitProxy = mojitProxy;
            Y.mojito.pjax.setContainer(container);
        },

        bind: function(node) {
            this.node = node;
        }
    };

}, '0.0.1', {requires: ['mojito-client', 'node-base', 'itsa-mojitonthefly']});
```
The next utilitymethods are available:

    * Y.mojito.pjax.setContainer(container); // set default container (parentNode)
    * Y.mojito.pjax.setCacheTime(sec); // set default cachetime
    * Y.mojito.pjax.emptyCache(); // empty cache, forcing to reload the mojit from the server
    * Y.mojito.pjax.pjaxAvailable(); // boolean: if pjax can be used (only if HTML5-history is available)
    * Y.mojito.pjax.simulateAnchorClick(anchornode); // simulate an anchorclick through Pjax, is a better simulation than a nodeclick, for the classnames and history-state are updated

_Events:_
Pjax will file the `pjax-event` on the Y-instance. The eventobject has the properties:

    * uri (anchornode's href)
    * targetnode (anchornode)
    * fromhistory (whether the pjac is initiated by history's back/foreward button)

Step 4:
-------

Because Mojits are defined dynamicly, the also are removed dynamicly.
You MUST make sure to handle Mojit-destruction well!
This addon makes advantage of a `destructor()`-method,
that can be defined inside the binder. This destructor
should also be called from within `onRefreshView()`.

The `destructor`-method is not officially part of Mojito, but
_Y.Node.loadMojit()_ and _Y.mojito.pjax_ will call it before removing
(should the destructor is defined).

The destructor should be defined within the Mojits who are to be executed, not
the masterMojit who controls the logic (as specified in _Step 3_).

`example:`
```js
YUI.add('scrollview-binder-index', function(Y, NAME) {

    Y.namespace('mojito.binders')[NAME] = {
        init: function(mojitProxy) {
            this.mojitProxy = mojitProxy;
        },

        bind: function(node) {
            var instance = this,
                svContainer = node.one('.scrollist');
            instance.node = node;
            instance.scrollview = new Y.ScrollView({
                srcNode: svContainer,
                height: '11.5em'
            }).render();
        },

        onRefreshView: function (node) {
            var instance = this;
            instance.destructor();
            instance.bind(node);
        },

        destructor: function() {
            var instance = this;
            instance.scrollview.destroy(true);
        }

    };

}, '0.0.1', {requires: ['mojito-client', 'scrollview']});

```

Examples
--------

See the examplefolder for 2 working examples.
They show the powerful usage of `itsa-mojitonthefly-addon`.

License
-------

Copyright (c) 2014 It's Asbreuk <marco@itsasbreuk.nl>.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.