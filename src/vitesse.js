( function ( ) {
    var fs      = require( 'fs' );
    var props   = require( 'node-props' );
    var mug     = require( 'node-mug' );
    var express = require( 'express' );
    var crypto  = require( 'crypto' );

    var log     = function (m) {};
    var dao;
    var generator;

    if( module && module.exports ) {
	module.exports.createServer = function ( properties ) {
	    return( new vitesse( properties ) );
	}
    }

    function vitesse( properties ) {
	if( properties && properties.log ) {
	    log = properties.log;
	    dao = properties.dao;
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
		    generator = g;

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
	    '/app' : 'app'
	};

	function stockHandler ( template ) {
	    return function ( request, response ) {
		dao.getSiteInfo( function ( err, data ) {
		    response.render( template, {
			title: data.title,
			subtitle: data.subtitle,
			copy: data.copy,
			session: request.cookies[ 'webid' ]
		    } );
		} );
	    }
	}

	for( var endpoint in stockEndpoints ) {
	    var template = stockEndpoints[ endpoint ];
	    app.get( endpoint, stockHandler( template ) );
	}
    };

    vitesse.prototype.addStockApiEndpoints = function( properties, app ) {
	app.post( '/api/login.local', login_local );
	app.get( '/api/login.twitter', _unimplemented() );
	app.get( '/api/callback.twitter', _unimplemented() );
	app.post( '/api/logout', _unimplemented() );
    };

    function _unimplemented () {
	return function ( request, response ) {
	    log( "unimplemented" );
	    var data = JSON.stringify( {success:false,error:'call unimplemented'} );
	    response.writeHead( 200, {'Content-Type': 'application/json', 'Content-Length': data.length} );
	    response.end( data );
	};
    }

    function login_local ( request, response ) {
	var response_object = {
	    success: false,
	    errno: 1,
	    error: 'Username or Password Invalid'
	};
	var syndrome;
	var id_record;

	if( request.body && request.body.email && request.body.passwd ) {
	    dao.getEmailIdentity( request.body.email, postGetEmailIdentity );
	} else {
	    return complete();
	}

	function postGetEmailIdentity( error, data ) {
	    if( error ) {
		return complete();
	    } else {
		var salt = new Buffer( data.password.salt, 'base64' );
		syndrome = data.password.syndrome;
		id_record = data;
		crypto.pbkdf2( request.body.passwd, salt, data.password.count, 20, postKeyGen );
	    }
	}

	function postKeyGen( err, derivedKey ) {
	    if( err ) {
		return complete();
	    } else {
		var e = new Buffer( 20 );
		for( var i = 0; i < 20; i++ ) {
		    e[i] = derivedKey.charCodeAt( i );
		}
		var d = e.toString( 'base64' );
		if( d === syndrome ) {
		    generator.generate( createSession );
		} else {
		    return complete();
		}
	    }
	}

	function createSession ( uuid ) {
	    dao.createSession( { id: uuid.toString(), user: id_record.user }, function ( err ) {
		    if( err ) {
			response_object = {
			    success: false,
			    errno: 3,
			    error: 'Database Error'
			};
			return complete();
		    } else {
			successLogin( uuid );
		    }
		} );
	}

	function successLogin ( uuid ) {
	    response_object = {
		success: true,
		webid: uuid.toString()
	    };
	    dao.dumpSessions();
	    return complete();
	}

	function complete () {
	    response.writeHead( 200, { 'Content-Type': 'application/json' } );
	    response.end( JSON.stringify( response_object ) );
	}
    }

} ) ();