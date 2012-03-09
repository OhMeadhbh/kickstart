( function ( ) {
    var fs      = require( 'fs' );
    var props   = require( 'node-props' );
    var mug     = require( 'node-mug' );
    var express = require( 'express' );
    var webid   = require( './webid' );

    var log     = function (m) {};

    if( module && module.exports ) {
	module.exports.createServer = function ( properties ) {
	    return( new vitesse( properties ) );
	}
    }

    function vitesse( properties ) {
	if( properties && properties.log ) {
	    log = properties.log;
	}
    }

    vitesse.prototype.init = function ( complete ) {
	var that = this;

	log( "starting server" );

	props.read( function( p ) {
		log( "read properties" );
		that.defaults = p;
	
		init_mug();
	    } );

	function init_mug () {
	    mug.createInstance( function( g ) {
		    log( "initialized UUID generator" );
		    that.generator = g;

		    init_express();
		} );
	}

	function init_express () {
	    log( "initializing server" );
	    that.app = express.createServer();
	    var defaults = that.defaults;
	    var app = that.app;

	    defaults.publicUrl && ( publicUrl = defaults.publicUrl );
	    defaults.errorHandler && app.use( express.errorHandler( defaults.errorHandler ) );
	    defaults.faviconPath && app.use( express.favicon( defaults.faviconPath ) );
	    defaults.logPath && app.use( express.logger( {stream: fs.createWriteStream( defaults.logPath )} ) );
	    defaults.staticPath && app.use( express.static( defaults.staticPath ) );
	    app.use( express.cookieParser() );
	    app.use( webid( that.generator ) );
	    app.use( express.bodyParser() );
	    app.use( app.router );

	    if( defaults.views ) {
		defaults.views.path && app.set( 'views', defaults.views.path );
		defaults.views.engine && app.set( 'view engine', defaults.views.engine );
	    }

	    log( "calling out to init callback" );
	    complete && complete( defaults, app );
	}

	return this;
    };

    vitesse.prototype.start = function () {
	var defaults = this.defaults;

	if( defaults.listen && defaults.listen.port ) {
	    this.privateUrl = 'http://' + _aon( defaults.listen.host ) +
		_aon( defaults.listen.port, ':' ) + '/';
	    this.app.listen( defaults.listen.port, defaults.listen.host );
	    log( "listening on " + this.privateUrl );
	    this.defaults.publicUrl && log( "public URL is " + this.defaults.publicUrl );
	}

	function _aon( input, pre ) {
	    return ( pre ? _aon( pre ) : '' ) + ( input ? input : '' );
	}
    }

    vitesse.prototype.addStockEndpoints = function ( properties, app ) {
	var stockEndpoints = {
	    '/': 'home',
	    '/about' : 'about',
	    '/about/floss' : 'about_floss',
	    '/about/faq' : 'about_faq',
	    '/about/javascript' : 'about_javascript',
	    '/about/tou' : 'about_tou',
	    '/about/privacy' : 'about_privacy',
	    '/register' : 'register',
	    '/login' : 'login',
	    '/logout' : 'logout',
	    '/app' : 'app'
	};

	function stockHandler ( template ) {
	    return function( request, response ) {
		response.render( template, stockProperties( request.webid ) );
	    };
	}

	function stockProperties ( webid ) {
	    return( {
		    title: properties.site.title,
		    subtitle: properties.site.subtitle,
		    copy: properties.site.copy,
		    session: webid
		} );
	}

	for( var endpoint in stockEndpoints ) {
	    var template = stockEndpoints[ endpoint ];
	    app.get( endpoint, stockHandler( template ) );
	}
    };

} ) ();