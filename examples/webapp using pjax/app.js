/*jslint nomen:true, node:true*/

var express = require('express'),
    libmojito = require('mojito'),
    mojitOnthefly = require( "itsa-mojitonthefly-addon" ),
    app;

app = express();

// Set the port to listen on.
app.set('port', process.env.PORT || 8666);

// Create a new Mojito instance and attach it to `app`.
// Options can be passed to `extend`.
libmojito.extend(app, {
    context: {
        environment: "development"
    }
});

// Load the built-in middleware or any middleware
// configuration specified in application.json
app.use(libmojito.middleware());

// must be set AFTER app.use(libmojito.middleware());
mojitOnthefly.extend(app, libmojito);

app.get('/', libmojito.dispatch('htmlframe.home'));
app.get('/page1.html', libmojito.dispatch('htmlframe.page1'));
app.get('/page2.html', libmojito.dispatch('htmlframe.page2'));
app.get('/page3.html', libmojito.dispatch('htmlframe.page3'));


app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port') + ' ' +
                   'in ' + app.get('env') + ' mode');
});


