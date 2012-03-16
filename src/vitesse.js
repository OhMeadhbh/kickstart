( function ( ) {
    var fs      = require( 'fs' );
    var props   = require( 'node-props' );
    var mug     = require( 'node-mug' );
    var express = require( 'express' );
    var crypto  = require( 'crypto' );
    var OAuth   = require( 'oauth' ).OAuth;

    var log     = function (m) {};
    var dao;
    var generator;
    var oa;
    var defaults;

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
		defaults = p;
	
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

	if( defaults.listen && defaults.listen.port ) {
	    this.privateUrl = 'http://' + _aon( defaults.listen.host ) +
		_aon( defaults.listen.port, ':' ) + '/';
	    this.app.listen( defaults.listen.port, defaults.listen.host );
	    log( "listening on " + this.privateUrl );
	    defaults.publicUrl && log( "public URL is " + defaults.publicUrl );
	}

	function _aon( input, pre ) {
	    return ( pre ? _aon( pre ) : '' ) + ( input ? input : '' );
	}
    }

    vitesse.prototype.addStockEndpoints = function ( properties, app ) {
	var stockEndpoints = {
	    '/': { template: 'root', layout: 'root' },
	    '/start': { template: 'start' },
	    '/about' : { template: 'about' },
	    '/about/floss' : { template: 'about_floss' },
	    '/about/faq' : { template: 'about_faq' },
	    '/about/javascript' : {template: 'about_javascript'},
	    '/about/tou' : {template: 'about_tou'},
	    '/about/privacy' : { template: 'about_privacy'},
	    '/app' : {template: 'app', layout: 'applayout'}
	};

	function stockHandler ( info ) {
	    return function ( request, response ) {
		dao.getSiteInfo( function ( err, data ) {
		    var template_data = {
			title: data.title,
			subtitle: data.subtitle,
			copy: data.copy,
			session: request.cookies[ 'webid' ]
		    };
		    if( info.layout ) {
			template_data.layout = info.layout;
		    }
		    response.render( info.template, template_data );
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
	app.get( '/api/login.twitter', login_twitter );
	app.get( '/api/callback.twitter', callback_twitter );
	app.post( '/api/logout', logout );
	app.get( '/api/seed/:id', seed );
    };

    function _unimplemented () {
	return function ( request, response ) {
	    log( "unimplemented" );
	    var data = JSON.stringify( {success:false,error:'call unimplemented'} );
	    response.writeHead( 200, {'Content-Type': 'application/json', 'Content-Length': data.length} );
	    response.end( data );
	};
    }

    function _wrap_properties ( properties, f ) {
	return function ( request, response ) {
	    request.properties = properties;
	    f( request, response );
	};
    }

    function _render_error ( request, response ) {
	response.render( 'error', { title: 'error', error: request.error } );
    }

    function callback_twitter ( request, response ) {
	var session;
	var oauth_access_token;
	var oauth_access_token_secret;
	var results;
	if( oa ) {
	    dao.getSession( request.cookies['webid'], function( err, data ) {
		    session = data;
		    if( err ) {
			request.error = err.toString();
			return _render_error( request, response);
		    } else {
			return oa.getOAuthAccessToken( data.oauth_token, data.oauth_token_secret, request.query.oauth_verifier, goaat_callback );
		    }
		} );
	} else {
	    request.error = "OAuth unimplemented";
	    return _render_error( request, response );
	}
	
	// get OAuth Access Token (goaat) callback
	function goaat_callback ( error, o, os, r ) {
	    oauth_access_token = o;
	    oauth_access_token_secret = os;
	    results = r;
	    if( error ) {
		request.error = error.toString();
		return _render_error( request, response );
	    } else {
		return dao.getTwitterIdentity( results.screen_name, post_get );
	    }
	}

	function post_get ( err, data ) {
	    if( err ) {
		if( 'record not found' === err.toString() ) {
		    data = {
			id: results.screen_name,
			oauth_access_token: oauth_access_token,
			oauth_access_token_secret: oauth_access_token_secret,
			user_id: results.user_id
		    };
		    return dao.createTwitterIdentity( data, post_create );
		} else {
		    request.error = err.toString();
		    return _render_error( request, response );
		}
	    } else {
		data.oauth_access_token = oauth_access_token;
		data.oauth_access_token_secret = oauth_access_token_secret;
		data.user_id = results.user_id;
		session.user = data.user;
		return dao.putTwitterIdentity( data, post_put );
	    }
	}

	function post_create( err ) {
	    session_final( '/register' );
	}

	function post_put ( err ) {
	    if( err ) {
		request.error = err.toString();
		return _render_error( request, response );
	    } else {
		session_final( '/app' );
	    }
	}

	function session_final ( redirectTo ) {
	    delete session.oauth_token;
	    delete session.oauth_token_secret;
	    return dao.putSession( session, function( err ) {
		    response.redirect( redirectTo );
		} );
	}
    }

    function login_twitter ( request, response ) {
	var oauth_token;
	var oauth_token_secret;
	var uuid;

	if( defaults.twitter ) {
	    var t = defaults.twitter;
	    if( ! oa ) {
		oa = new OAuth( 
			       t.request_token_url,
			       t.access_token_url,
			       t.consumer_key,
			       t.consumer_secret,
			       t.version,
			       t.callback_url,
			       t.mac_algo );
	    }

	    return oa.getOAuthRequestToken( goart );
	} else {
	    return _unimplemented() (request, response);
	}

	//get oauth request token (goart) callback
	function goart( error, ot, ots ) {
	    if( error ) {
		request.error = error.toString();
		return _render_error( request, response );
	    } else {
		oauth_token = ot;
		oauth_token_secret = ots;
		generator.generate( goart_post_generate );
	    }
	}

	function goart_post_generate( u ) {
	    uuid = u;
	    var session_opts = {
		id: uuid.toString(),
		user: '00000000-0000-0000-0000-000000000000',
		oauth_token: oauth_token,
		oauth_token_secret: oauth_token_secret
	    };
	    dao.createSession( session_opts, goart_post_create_session ); 
	}

	function goart_post_create_session ( err, data ) {
	    if( err ) {
		request.error = error.toString();
		return _render_error( request, response );
	    } else {
		var cookie_opts = {
		    expires: new Date( Date.now() + 86400000 ),
		    path: '/'
		} ;
		response.cookie( 'webid', uuid.toString(), cookie_opts );
		response.redirect( 'https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token );
	    }
	}
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
	    return complete();
	}

	function complete () {
	    response.writeHead( 200, { 'Content-Type': 'application/json' } );
	    response.end( JSON.stringify( response_object ) );
	}
    }

    function logout ( request, response ) {
	var response_object = {
	    success: false,
	    errno: 1,
	    error: 'Invalid Session'
	};

	if( request.body && request.body.webid ) {
	    dao.deleteSession( request.body.webid, postDeleteSession );
	} else {
	    return complete();
	}

	function postDeleteSession (err, data) {
	    if( ! err ) {
		response_object = {
		    success: false,
		};
		response.clearCookie( 'webid', {path: '/'} );
	    }
	    return complete();
	}

	function complete () {
	    response.writeHead( 200, { 'Content-Type': 'application/json' } );
	    response.end( JSON.stringify( response_object ) );
	}
    }

    function seed ( request, response ) {
	var response_object = {
	    success: false,
	    errno: 1,
	    error: 'Invalid Session'
	};

	if( ! request.params.id ) {
	    return complete();
	}

	dao.getSession( request.params.id, function( err, data ) {
		if( err ) {
		    response_object.errno = 2;
		    response_object.error = err.toString();
		    return complete();
		} else {
		    dao.getUser( data.user, function( err, data ) {
			    if( err ) {
				response_object.errno = 3;
				response_object.error = err.toString();
				return complete();
			    } else {
				response_object = {
				    success: true,
				    userinfo: data
				}
				return complete();
			    }
			} );
		
		}
	    } );


	function complete () {
	    response.writeHead( 200, { 'Content-Type': 'application/json' } );
	    response.end( JSON.stringify( response_object ) );
	}

    }

} ) ();