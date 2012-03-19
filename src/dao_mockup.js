(function(){
	function dao ( options ) {
		this.options = options;
    }

    if( module && module.exports ) {
    	module.exports = dao;
    }

    dao.prototype.init = function ( complete ) {	
    	(_safe_function(complete))(null);
    };

    var site_info = {
    	login: "/api/login.local",
    	title: "kickstart",
    	subtitle: "'cause it sux to keep doing the same thing over and over",
    	copy: "Copyright &copy; 2011-2012 Meadhbh S. Hamrick, All Rights Reserved"
    };

    var twitter_ids = {
    	'OhMeadhbh': {
    		id: 'OhMeadhbh',
    		user: 'faf60e8d-26e6-4469-8467-e42276cde9b8',
    		name: 'Meadhbh Hamrick'
    	}
    };

    var email_ids = {
    	'OhMeadhbh@gmail.com': {
    		user : 'faf60e8d-26e6-4469-8467-e42276cde9b8',
    		id: 'OhMeadhbh@gmail.com',
    		name: 'Meadhbh Hamrick',
    		password: {
    			count: 1024,
    	    	salt: 'zpAtI1MlHUM=',
			secret: 'FudmjBs+B5a/2IlK2UKbGOM4YwU='
    		}
    	}
    };

    var users = {
    	'faf60e8d-26e6-4469-8467-e42276cde9b8': {
    		id: 'faf60e8d-26e6-4469-8467-e42276cde9b8',
    		name: 'Meadhbh S. Hamrick',
    		dob: '01 Jan, 1970',
    		twitter_ids: ['OhMeadhbh' ],
    		email_ids: ['OhMeadhbh@gmail.com'],
    		tos_accepted: '01 Jan, 1970'
    	}
    };

    var tos = {
    	changed: '01 Jan, 2012',
    	text: 'this is the terms of service.'
    };

    var sessions = {};

    var mail_queue = {};
    
    function _safe_function ( f ) {
	if( 'function' === typeof f ) {
	    return f;
	} else {
	    return function () {};
	}
    }

    function _get( collection ) {
	return function( id, complete ) {
	    var safe = _safe_function( complete );
	    try {
		if( collection[ id ] ) {
		    safe( null, collection[ id ] );
		} else {
		    safe( 'record not found', null );
		}
	    } catch ( e ) {
		safe( e.toString(), null );
	    }
	};
    }

    function _create( collection ) {
	return function( content, complete ) {
	    var safe = _safe_function( complete );
	    if( content.id ) {
		if( ! collection[ content.id ] ) {
		    collection[ content.id ] = content;
		    safe( null );
		} else {
		    safe( 'already exists' );
		}
	    } else {
		safe( 'no id' );
	    }
	};
    }

    function _put( collection ) {
	return function( content, complete ) {
	    var safe = _safe_function( complete );
	    if( content.id ) {
		if( collection[ content.id ] ) {
		    collection[ content.id ] = content;
		    safe( null );
		} else {
		    safe( 'does not exist' );
		}
	    } else {
		safe( 'no id' );
	    }
	};
    }

    function _delete( collection ) {
	return function( id, complete ) {
	    var safe = _safe_function( complete );
	    if( id ) {
		if( collection[ id ] ) {
		    delete collection[ id ];
		    safe( null );
		} else {
		    safe( 'does not exist' );
		}
	    } else {
		safe( 'no id' );
	    }
	};
    }

    function _build_accessors ( collection, name ) {
	dao.prototype[ 'create' + name ] = _create( collection );
	dao.prototype[ 'get' + name ] = _get( collection );
	dao.prototype[ 'put' + name ] = _put( collection );
	dao.prototype[ 'delete' + name ] = _delete( collection );
    }

    _build_accessors( sessions, 'Session' );
    _build_accessors( users, 'User' );
    _build_accessors( twitter_ids, 'TwitterIdentity' );
    _build_accessors( email_ids, 'EmailIdentity' );
    _build_accessors( mail_queue, 'MailQueue' );

    dao.prototype.getTos = function ( complete ) {
	(_safe_function(complete))(null,{changed:new Date(tos.changed),text:tos.text});
    };

    dao.prototype.getSiteInfo = function ( complete ) {
	(_safe_function(complete))(null, site_info );
    };

    dao.prototype.putTos = function ( content, complete ) {
	var safe = _safe_function(complete);
	if( content ) {
	    tos.changed = content.changed.toString();
	    tos.text = content.text;
	    safe( null );
	} else {
	    safe( 'no tos' );
	}
    };
    
    dao.prototype.dumpTwitterIds = function () {
    	console.log( twitter_ids );
    };
    
    dao.prototype.dumpUsers = function () {
    	console.log( users );
    };
    
    dao.prototype.dumpSessions = function () {
    	console.log( sessions );
    };
})();