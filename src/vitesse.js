( function ( ) {
    var fs      = require( 'fs' );
    var express = require( 'express' );
    var OAuth   = require( 'oauth' ).OAuth;
    var password= require( './password' );
    var https   = require( 'https' );
    var emailjs = require( 'emailjs' );
    
    var log; 
    var uuid;
    var oa;
    var defaults = {};
    var dao;
    
    if( module && module.exports ) {
    	module.exports.createServer = function ( properties ) {
    	    return( new vitesse( properties ) );
    	};
    }

    function vitesse( properties ) {
    	if( properties ) {
            defaults  = properties;
    	    log       = properties.log;
    	    uuid = properties.uuid;
    	    dao       = properties.dao;
    	}
    }

    vitesse.prototype.init = function ( complete ) {
    	log( "initializing server" );
    	
    	var app = this.app = express.createServer();
	var format = "\":date\",\":req[x-forwarded-for]\",:status,:method,\":url\",\":referrer\",\":user-agent\"";

	defaults.errorHandler && app.use( express.errorHandler( defaults.errorHandler ) );
	defaults.faviconPath && app.use( express.favicon( defaults.faviconPath ) );
	defaults.logFormat && ( format = defaults.logFormat );
	defaults.logPath && app.use( express.logger( { stream: fs.createWriteStream( defaults.logPath, {flags:'a',encoding:'utf-8',mode:0644 } ), format: format } ) );
	defaults.staticPath && app.use( express.static( defaults.staticPath ) );
	app.use( express.cookieParser() );
	app.use( express.bodyParser() );
	app.use( app.router );

	if( defaults.views ) {
	    defaults.views.path && app.set( 'views', defaults.views.path );
	    defaults.views.engine && app.set( 'view engine', defaults.views.engine );
    	}

	log( "calling out to init callback" );
		
	complete && complete( this, app );

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
    };

    vitesse.prototype.addStockHTMLEndpoints = function ( app ) {
	var siteInfo;
	var anonymousUser = {
	    uuid: '00000000-0000-0000-000000000000',
	    name: 'Anonymous User',
	    profileUrl: '/img/anon.jpg',
	    utcOffset: 0
	};

    	var stockEndpoints = {
   	    '/': { template: 'root', layout: 'root' },
   	    '/start': { template: 'start' },
   	    '/about' : { template: 'about' },
   	    '/about/floss' : { template: 'about_floss' },
   	    '/about/faq' : { template: 'about_faq' },
   	    '/about/javascript' : {template: 'about_javascript'},
   	    '/about/tou' : {template: 'about_tou'},
   	    '/about/privacy' : { template: 'about_privacy'},
   	    '/app' : {template: 'app'},
   	    '/mail/:mailid' : {template: 'mail'}
    	};

    	function stockHandler ( info ) {
    	    return function ( request, response ) {
		if( siteInfo ) {
		    getSessionInfo();
		} else {
    		    dao.siteInfoRead( null, function ( err, data ) {
			siteInfo = data;
			getSessionInfo();
		    } );
		}

		function getSessionInfo () {
		    if( request.cookies && request.cookies.webid ) {
			dao.sessionRead( request.cookies.webid, function( err, data ) {
			    if( data.user && ( ! err ) ) {
				getUserInfo( data.user );
			    } else {
				getUserInfo( null );
			    }
			} );
		    } else {
			getUserInfo( null );
		    }
		}

		function getUserInfo ( userid ) {
		    if( userid ) {
			dao.userRead( userid, function( err, data ) {
			    if( err ) {
				completeRequest( anonymousUser );
			    } else {
				completeRequest( data );
			    }
			} );
		    } else {
			completeRequest( anonymousUser );
		    }
		}
		
		function completeRequest( user ) {
		    log( 'got data for user ' + user.uuid );
		    console.log( user );

		    request.userinfo = user;

    		    var template_data = {
    			title: siteInfo.title,
    			subtitle: siteInfo.subtitle,
    			copy: siteInfo.copy,
    			session: request.cookies[ 'webid' ],
    			mailid: request.params.mailid,
			userinfo: user
    		    };
    		    
    		    if( info.layout ) {
    			template_data.layout = info.layout;
    		    }

    		    response.render( info.template, template_data );
    		}
    	    };
    	}

    	for( var endpoint in stockEndpoints ) {
    	    var template = stockEndpoints[ endpoint ];
    	    app.get( endpoint, stockHandler( template ) );
    	}
    };

    vitesse.prototype.addStockApiEndpoints = function( app ) {
    	app.post( '/api/login.local', login_local );
    	app.get( '/api/login.twitter', login_twitter );
    	app.get( '/api/callback.twitter', callback_twitter );
    	app.post( '/api/provision.local', provision_local );
    	app.post( '/api/provision.complete', provision_complete );
    	app.post( '/api/logout', logout );
    	app.get( '/api/seed/:id', seed );
    };

    function _unimplemented () {
    	return function ( request, response ) {
    	    log( "unimplemented" );
    	    _complete( response, {success:false,error:'call unimplemented'} );
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

    function _complete( response, response_object ) {
    	var response_string = JSON.stringify( response_object );
	response.writeHead( 200, { 'Content-Type': 'application/json', 'Content-Length': response_string.length } );
	response.end( response_string );
    }
    
    function _wrap_error( request, response, err, f ) {
    	if( err ) {
    	    request.error = err.toString();
    	    return _render_error( request, response );
    	} else {
    	    f();
    	}
    }
    
    function provision_local ( request, response ) {
    	var email_id;
    	if( request.body.email && request.body.passwd && request.body.name ) {
    	    console.log( request.body.email );
    	    dao.emailIdentityRead( request.body.email, function( err, data ) {
    		if( err ) {
    		    if( 'record not found' == err ) {
    			uuid.generate( post_generate );
    		    }
    		} else {
    		    _complete( response, {success: false, errno:13, error: 'account already exists'} ); 
    		}
    	    } );
    	} else {
    	    return _complete( response, {success: false, errno: 12, error: 'need to provide email, password and name' } );	
    	}
    	
    	function post_generate( u ) {
    	    email_id = u.toString();
    	    var mq_item = {
    		uuid: email_id,
    		email: request.body.email,
    		passwd: request.body.passwd,
    		name: request.body.name,
    		type: 'provision',
		expires: (Date.now() + 86400000)
    	    };
    		
    	    dao.mailQueueCreate( mq_item, post_create_mq );
    	}
    	
    	function post_create_mq( err ) {
    	    var server = emailjs.server.connect( defaults.email.server );

    	    var headers = {
    		from: defaults.email.headers.from,
    		subject: 'Welcome to Kickstart',
    		to: request.body.name + ' <' + request.body.email + '>',
    		text: 'Welcome to Kickstart'
    	    };
    		
    	    var message = emailjs.message.create( headers );
    	    var url = defaults.publicUrl + 'mail/' + email_id; 
    		
    	    var message_body = '<html><body><p>You, or someone impersonating you, recently signed up for an account at ' +
    		'<a href="' + defaults.publicUrl + '">Kickstart</a>. ' +
    		'To verify your account, click on this link:</p>' +
    		'<p><blockquote><a href="' + url + '">' + url + '</a></blockquote></p>' +
    		'<p>If you didn\'t sign up for this account, simply ignore this message and the sign-up request will time out.</p>' +
    		'<p>-cheers<br/>-Meadhbh Hamrick</p></html></body>';
    		
    	    message.attach( {
    		data: message_body, 
    		alternative:true
    	    } );
    		
    	    server.send( message, post_send_mail );
    	}
    	
    	function post_send_mail( err, message ) {
    	    if( err ) {
    		_complete( response, {success: false, errno: 14, error: err.toString() } );
    	    } else {
    		_complete( response, {success: true } );
    	    }
    	}
    }

    function provision_complete ( request, response ) {
	var response_object = {
	    success: false,
	    error: 'Provisioning ID invalid or expired'
	};

	var request_data;
	var user;
	var identity;
	var webid;

	if( request.body.mailid ) {
	    return dao.mailQueueRead( request.body.mailid, check_queue_item );
	} else {
	    return _complete( response, response_object );
	}

	function check_queue_item( err, data ) {
	    if( err ) {
		return _complete( response, {success:false, error: err.toString()} );
	    } else {
		request_data = data;
		if( data.expires >= Date.now() ) {
		    return uuid.generate( post_generate );
		} else {
		    return _complete( response, response_object );
		}
	    }
	}

	function post_generate( u ) {
	    user = {
		id: u.toString(),
		name: request_data.name,
		email_ids: [ request_data.email ]
	    };

	    (new password( {password: request_data.passwd, count: 2000} )).generateSecret( post_password );
	}

	function post_password( err, data ) {
	    if( err ) {
		return _complete( response, {success:false,error:err.toString()});
	    } else {
		delete data.password;
		identity = {
		    id: request_data.email,
		    user: user.id,
		    name: request_data.name,
		    password: data
		};
		return dao.emailIdentityCreate( identity, post_identity );
	    }
	}

	function post_identity ( err, data ) {
	    if( err ) {
		return _complete( response, {success:false,error:err.toString()});
	    } else {
		return dao.userCreate( user, post_user );
	    }
	}

	function post_user ( err, data ) {
	    if( err ) {
		return _complete( response, {success:false,error:err.toString()});
	    } else {
		uuid.generate( generate_session );
	    }
	}

	function generate_session( u ) {
	    webid = u.toString();
	    dao.sessionCreate( {id: webid, user: user.id}, post_session );
	}

	function post_session( err, data ) {
	    if( err ) {
		return _complete( response, {success:false,error:err.toString()});
	    } else {
		return _complete( response, {success:true, webid:webid} );
	    }
	}
    }
    
    function callback_twitter ( request, response ) {
    	var session;
    	var oauth_access_token;
    	var oauth_access_token_secret;
    	var results;
    	var user;
	
    	if( defaults.twitter ) {
    	    initialize_oa( defaults.twitter );
    	    dao.sessionRead( request.cookies['webid'], function( err, data ) {
    		session = data;
    		return _wrap_error( request, response, err, function () {
    		    return oa.getOAuthAccessToken( data.oauth_token, data.oauth_token_secret, request.query.oauth_verifier, goaat_callback );
    		} );
    	    } );
    	} else {
    	    return _unimplemented() (request, response);
    	}

    	// get OAuth Access Token (goaat) callback
    	function goaat_callback ( error, o, os, r ) {
    	    oauth_access_token = o;
    	    oauth_access_token_secret = os;
    	    results = r;

	    log( "authenticated by twitter as " + results.screen_name );

    	    return _wrap_error( request, response, error, function () {
    		return dao.twitterIdentityRead( results.screen_name, post_get );    			
    	    } );
    	}

    	function post_get ( err, data ) {
    	    if( err ) {
    		if( 'record not found' === err.toString() ) {
		    log( "i don't know about " + results.screen_name + "; getting extended info" );
    		    get_extended_info();
    		} else {
    		    request.error = err.toString();
    		    return _render_error( request, response );
    		}
    	    } else {
    		data.oauth_access_token = oauth_access_token;
    		data.oauth_access_token_secret = oauth_access_token_secret;
    		data.user_id = results.user_id;
    		session.user = data.user;

		log( "updating twitter identity info." );
    		return dao.twitterIdentityUpdate( data, post_put );
    	    }
    	}

    	function get_extended_info ( ) {
    	    var get_options = {
    		host: 'api.twitter.com',
    		path: '/1/users/lookup.json?user_id=' + results.user_id,
    		method: 'GET'
    	    };
    		
    	    var req = https.get( get_options, function(res) {
    		var data = "";
    		
    		res.on('data', function(chunk) {
    		    data += chunk;
    		});
    			
    		res.on( 'end', function () {
    		    post_get_extended_info( null, JSON.parse( data )[0] );
    		});
		
    	    } ).on('error', function(e) {
    		post_get_extended_info( e.toString(), null );
    	    } );
    		
    	    req.end();
    	}
    	
    	function post_get_extended_info( err, data ) {
    	    var twitter_id;
    		
    	    if( err ) {
		log( "tried to get extended info, got error: " + err.toString() );
    		request.error = err.toString();
    		_render_error( request, response );
    	    } else {
		log( "got extended info from twitter for " + results.screen_name );

    		user = {
            	    utcOffset: data.utc_offset,
        	    name: data.name,
//        	    location: data.location,
        	    profileUrl: data.profile_image_url,
//        	    lang: data.lang
    		};

    		twitter_id = {
    		    screenName: results.screen_name,
    		    oauthAccessToken: oauth_access_token,
    		    oauthAccessTokenSecret: oauth_access_token_secret,
    		    twitterUserId: results.user_id,
    		    name: data.name	
    		};

    		return dao.userCreate( user, function ( err, data ) {
    		    if( err ) {
    			request.error = err.toString();
    			return _render_error( request, response );
    		    }

		    log( "created user " + data.uuid + "/" + data.name );
		    user = data;

		    create_twitter_id()
		} );
    	    }

    		

    	    function create_twitter_id () {
		twitter_id.user = user.uuid;
    		return dao.twitterIdentityCreate( twitter_id, function( err, data ) {
    		    if( err ) {
    			request.error = err.toString();
    			return _render_error( request, response );
    		    }

		    log( "create twitter identity " + data.screenName );
		    twitter_id = data;

        	    return session_final( '/app' );
		} );	
    	    }    		
    	}
    	    	
    	function post_put ( err ) {
    	    _wrap_error( request, response, err, function () {
    		return session_final( '/app' );
    	    } );
    	}

    	function session_final ( redirectTo ) {
	    session.oauth_token = "";
	    session.oauth_token_secret = "";
	    if( user ) {
		session.user = user.uuid;
	    }
	    session.expires = (Date.now() + 86400000);

    	    return dao.sessionUpdate( session, function( err ) {
//        	dao.dumpTwitterIds();
//        	dao.dumpUsers();
//        	dao.dumpSessions();
		
		log( "updating session " + session.uuid );
    		response.redirect( redirectTo );
    	    } );
    	}
    }

    function initialize_oa( props ) {
    	if( ! oa ) {
    	    oa = new OAuth( 
    		props.request_token_url,
		props.access_token_url,
		props.consumer_key,
		props.consumer_secret,
		props.version,
		props.callback_url,
		props.mac_algo );
    	}
    };
    
    function login_twitter ( request, response ) {
    	var oauth_token;
    	var oauth_token_secret;
    	var u;
    	
    	if( defaults.twitter ) {
    	    initialize_oa( defaults.twitter );
    	    return oa.getOAuthRequestToken( goart );
    	} else {
    	    return _unimplemented() (request, response);
    	}

    	//get oauth request token (goart) callback
    	function goart( error, oauth_token, oauth_token_secret ) {

    	    return _wrap_error( request, response, error, function () {
    		var session_opts = {
    		    user: '00000000-0000-0000-0000-000000000000',
    		    oauth_token: oauth_token,
    		    oauth_token_secret: oauth_token_secret,
		    expires: (Date.now() + 86400000)
    		};
    		dao.sessionCreate( session_opts, goart_post_create_session ); 
    	    } );
    	}

    	function goart_post_create_session ( err, data ) {
    	    return _wrap_error( request, response, err, function () {		
    		var cookie_opts = {
		    path: '/'
        	};
        	response.cookie( 'webid', data.uuid, cookie_opts );
        	response.redirect( 'https://twitter.com/oauth/authenticate?oauth_token=' + data.oauth_token );
    	    } );
    	}
    }

    function login_local ( request, response ) {
    	var response_object = {
    	    success: false,
    	    errno: 1,
    	    error: 'Username or Password Invalid'
    	};

    	if( request.body && request.body.email && request.body.passwd ) {
    	    return dao.emailIdentityRead( request.body.email, function( err, data ) {
		if( err ) {
    		    return _complete( response, response_object );
		} else {
		    return validatePassword( data.user, {
			password: request.body.passwd,
			salt: data.salt,
			count: data.count,
			secret: data.secret
		    } );
		}
	    } );
    	} else {
    	    return _complete( response, response_object );
    	}

	function validatePassword( user, data ) {
	    (new password(data)).validatePassword( function( err, validated ) {
		if( err ) {
		    return _complete( response, response_object );
		} else {
		    if( validated ) {
			return createSession( user );
		    } else {
			return _complete( response, response_object );
		    }
		}
	    } );
    	}

    	function createSession ( user ) {
    	    dao.sessionCreate( { user: user, expires: (new Date( Date.now() + 86400000 ) ) }, function ( err, data ) {
    		if( err ) {
    		    response_object = {
    			success: false,
    			errno: 3,
    			error: 'Database Error'
    		    };
    		    return _complete( response, response_object );
    		} else {
    	    	    return _complete( response, { success: true, webid: data.uuid, expires: data.expires } );
    		}
    	    } );
    	}
    }

    function logout ( request, response ) {
    	var response_object = {
    	    success: false,
    	    errno: 1,
    	    error: 'Invalid Session'
    	};

    	if( request.body && request.body.webid ) {
    	    dao.sessionDelete( request.body.webid, postDeleteSession );
    	} else {
    	    return _complete( response, response_object );
    	}

    	function postDeleteSession (err, data) {
    	    if( ! err ) {
    		response_object = {
    		    success: true,
    		};
    		response.clearCookie( 'webid', {path: '/'} );
    	    }
    	    return _complete( response, response_object );
    	}
    }

    function seed ( request, response ) {
    	var response_object = {
    	    success: false,
    	    errno: 1,
    	    error: 'Invalid Session'
    	};
	
    	if( ! request.params.id ) {
    	    return _complete( response, response_object );
    	}

    	dao.sessionRead( request.params.id, function( err, data ) {
    	    if( err ) {
    		response_object.errno = 2;
    		response_object.error = err.toString();
    		return _complete( response, response_object );
    	    } else {
    		dao.userRead( data.user, function( err, data ) {
    		    if( err ) {
    			response_object.errno = 3;
    			response_object.error = err.toString();
    			return _complete( response, response_object );
    		    } else {
    			response_object = {
    			    success: true,
    			    userinfo: data
    			};
    			return _complete( response, response_object );
    		    }
    		} );	
    	    }
	} );
    }

} ) ();