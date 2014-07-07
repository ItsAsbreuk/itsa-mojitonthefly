/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('itsa-mojitonthefly-addon', function(Y, NAME) {
'use strict';
    var libfs = require('fs'),
        YUIaddMojitoMojitOnthefly, YUIloadMojitoOntheFly;

    YUIaddMojitoMojitOnthefly = function() {
        var rawFile = libfs.readFileSync('./node_modules/itsa-mojitonthefly-addon/assets/itsa-mojitonthefly-min.client.js', 'utf8');
        return rawFile;
    };

    YUIloadMojitoOntheFly = function() {
        return "var mYtimer=setInterval(function(){var Y=YUI._mojito&&YUI._mojito._clientY;if(Y){clearInterval(mYtimer);Y.use('itsa-mojitonthefly');}},50);";
    };

    function OntheflyAcAddon(command, adapter, ac) {
        if (!this.jsSend) {
            this.jsSend = true;
            // because addBlob 'bottom' puts the script just above all clientside-mojito YUI-code,
            // put loading 'itsa-mojitonthefly' behind the stack using setTimeout.
            // this makes all clientside-mojito stuff executed first

            ac.assets.addBlob("<script>\n"+YUIaddMojitoMojitOnthefly()+"\n"+YUIloadMojitoOntheFly()+"\n</script>", 'bottom');
        }
        // The "command" is the Mojito internal details
        // for the dispatch of the mojit instance.
        // The "adapter" is the output adapter, containing
        // the "done()", "error()", etc, methods.
        // The "ac" is the ActionContext object to which
        // this addon is about to be attached.
    }

    Y.namespace('mojito.addons.ac').mojitonthefly = OntheflyAcAddon;


}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon']});
