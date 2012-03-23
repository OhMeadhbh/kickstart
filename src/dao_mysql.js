( function ( ) {
    var mysql = require( 'mysql' );
    var fs    = require( 'fs' );

    var uuid;
    var log;

    function dao_mysql ( o ) {
	this.host = o.host;
	this.user = o.user;
	this.pass = o.pass;
	this.db   = o.db;
	uuid      = o.uuid;
	this.descriptorPath = o.descriptorPath;
	this.populate = o.populate;

	if( this.log ) {
	    log = this.log;
	} else {
	    log = require( 'util' ).log;
	}
    }

    if( module && module.exports ) {
    	module.exports = dao_mysql;
    }

    dao_mysql.prototype.init = function ( complete ) {
	var that = this;
    	this.descriptor = JSON.parse ( fs.readFileSync( this.descriptorPath, 'utf-8' ) );

    	this.client = mysql.createClient( {
    	    host: this.host,
    	    user: this.user,
    	    password: this.pass
    	} );

	if( this.populate ) {
	    return deleteExistingDatabase.apply( this, [this.descriptor ] );
	} else {
	    return read_database.apply( this, [ this.descriptor ] );
	}

	function deleteExistingDatabase( d ) {
	    this.client.useDatabase( 'mysql', function( err, data ) {
	        that.client.query( 'DROP DATABASE IF EXISTS ' + that.db );
    		that.client.query( 'CREATE DATABASE ' + that.db );
		read_database.apply( that, [d] );
	    } );
	}

    	function read_database ( d ) {
    	    this.client.useDatabase( this.db );

    	    for( var item in d ) {
    		var current = d[ item ];

    		_create_accessors( item, current );

		if( this.populate ) {		    
    		    _create_table( item, current );
    		    _populate_table( item, current.insert );
		}
    	    }

    	    complete( null, this );
    	}

    	function _populate_keys ( fields ) {
    	    var keys = [];

    	    for( var item in fields ) {
    		keys.push( item );
    	    }

    	    keys.sort();

    	    return( keys );
    	}

    	function _fields ( keys, source ) {
    	    var fields = [];

    	    for( var i = 0, il = keys.length; i < il; i++ ) {
    		fields.push( source[ keys[i] ] );
    	    }

    	    return( fields );
    	}

    	function _create_table( name, data ) {
    	    var create = "CREATE TABLE " + name + "( ";
    	    var fields = [];

    	    for( var item in data.items ) {
    		var current = data.items[ item ];
    		var current_field = item + " " + current;
    		if( item === data.key ) {
    		    current_field += " KEY";
    		}
    		fields.push( current_field );
    	    }

    	    create += fields.join(',') + ")";

    	    that.client.query( create );

	    if( ! data.key ) {
		that.client.query( 'INSERT INTO ' + name + ' () VALUES ()' );
	    }
    	}

    	function _create_accessors( name, fields ) {
    	    if( name && fields ) {
    		_populate_keys( fields );
    		fields.key && _create_create_accessor( name, fields );
    		_create_read_accessor( name, fields );
    		_create_update_accessor( name, fields );
    		fields.key && _create_delete_accessor( name, fields );
		fields.select && _create_by_accessors( name, fields );
    	    }

	    function _create_by_accessors ( name, fields ) {
		for( var item in fields.select ) {
		    that[ name + 'ReadBy' + item.substring( 0, 1 ).toUpperCase() + item.substring( 1 ) ] = function ( id, complete ) {
			var query = 'SELECT * FROM ' + name + ' WHERE ' + item + '=?';
    			that.client.query( query, [id], complete );
		    };
		}
	    }

    	    function _create_create_accessor( name, fields ) {
    		that[ name + 'Create' ] = function( source, complete ) {
    		    var keys;
    		    var query;

    		    if( source[ fields.key ] ) {
    			_insert( source[ fields.key ] );
    		    } else {
    			uuid.generate( _insert );
    		    }

    		    function _insert( u ) {
    			if( u ) {
    			    source[ fields.key ] = u.toString();
    			}

    			keys = _populate_keys( source );

    			query = 'INSERT INTO ' + name + ' SET ' + keys.join( '=?,' ) + '=?';

    			that.client.query( query, _fields( keys, source ), _err( _finish ) );

    			function _finish( err, info ) {
    			    complete( null, source );
    			}
    		    }
    		};
    	    }

    	    function _create_read_accessor( name, fields ) {
    		that[ name + 'Read' ] = function ( id, complete ) {
		    if( fields.key ) {
			var query = 'SELECT * FROM ' + name + ' WHERE ' + fields.key + '=?';
    			that.client.query( query, [id], _err( _final ) );
		    } else {
			that.client.query( 'SELECT * FROM ' + name, [], _err( _final ) );
		    }

    		    function _final( err, data ) {
			if( data && ( data.length > 0 ) ) {
    			    complete( err, data[0] );
			} else {
			    complete( 'record not found', null );
			}
    		    }
    		};
    	    }

    	    function _create_update_accessor( name, fields ) {
    		that[ name + 'Update' ] = function( source, complete ) {
    		    var keys;
    		    var flist;

    		    keys = _populate_keys( source );
    		    flist = _fields( keys, source );

    		    if( source[ fields.key ] ) {
    			flist.push( source[ fields.key ] );
    			that.client.query( 'UPDATE ' + name + ' SET ' + keys.join( '=?,' ) + '=? WHERE ' + fields.key + '=?', flist, _err( _final ) );
    		    } else {
			that.client.query( 'UPDATE ' + name + ' SET ' + keys.join( '=?,' ) + '=?', flist, _err( _final ) );
    		    }

    		    function _final( err, info ) {
    			complete( null, source );
    		    }
    		};
    	    }

    	    function _create_delete_accessor( name, fields ) {
    		that[ name + 'Delete' ] = function( id, complete ) {
    		    that.client.query( 'DELETE FROM ' + name + ' WHERE ' + fields.key + '=?', [id], _final );

    		    function _final( err, info ) {
    			complete( err, null );
    		    }
    		};
    	    }
    	}
    	
    	function _populate_table (name, fields) {
    	    var f = that[ name + 'Create' ] || that[ name + 'Update' ];

    	    if( fields && f ) {
    		for( var i = 0, il = fields.length; i < il; i++ ) {
    		    f( fields[i], _f( null ) );
    		}
    	    }
    	}

    	return( this );
    };

    dao_mysql.prototype.close = function ( complete ) {
    	this.client.end( complete );
    };
    
    function _safe( f ) {
    	return function ( id, complete ) {
    	    try {
    		return f.apply( this, [ id, complete ] );
    	    } catch( e ) {
    		return complete( e.toString(), null );
    	    }
    	};
    }

    function _err( f ) {
    	return function( err, data ) {
    	    if( err ) {
    		return f.apply( this, [ err.toString(), null ] );
    	    } else {
    		return f( null, data );
    	    }
    	};
    }

    function _f ( f ) {
    	if( f ) {
    	    return f;
    	} else {
    	    return function () {};
    	}
    }

} ) ( );