#!/usr/bin/env node

var dao_mysql = require( '../src/dao_mysql' );
var mug       = require( 'node-mug');
var log       = require( 'util' ).log;

var dao;

var date1;
var date2;

var dao_options = {
    "host": "localhost",
    "user": "angelina",
    "pass": "2ebe5aph",
    "db": "angelina",
    "descriptorPath": "db_descriptor.json",
    "populate": true
};

log( "initializing UUID generator" );

mug.createInstance( function ( generator ) {
    dao_options.uuid = generator;

    log( "creating DAO" );
    create_dao();
} );

function create_dao() {
    dao = new dao_mysql( dao_options );

    log( "initializing DAO" );
    dao.init( function ( err, data ) {
	if( err ) {
	    log( 'dao.init() err: ' + err.toString() );
	    dao.close( _closed );
	    process.exit( 2 );
	}

	setTimeout( function () { dao.close( _closed ); }, 1000 );

    } );
}

function _closed () {
    log( "DB connection closed" );
}
