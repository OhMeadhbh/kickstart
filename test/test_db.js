var dao_mysql = require( '../src/dao_mysql' );
var mug       = require( 'node-mug');
var log       = require( 'util' ).log;
var assert    = require( 'assert' );
var props     = require( 'node-props' );

var dao;

var date1;
var date2;

var dao_options;

log( "reading properties file" );

props.read( function ( p ) {
  dao_options = p.persistence;
  dao_options.populate = true;
  init_mug();
} );

function init_mug () {
  log( "initializing UUID generator" );

  mug.createInstance( function ( generator ) {
    dao_options.uuid = generator;

    log( "creating DAO" );
    create_dao();
  } );
}

function create_dao() {
    dao = new dao_mysql( dao_options );

    log( "initializing DAO" );
    dao.init( function ( err, data ) {
	if( err ) {
	    log( 'dao.init() err: ' + err.toString() );
	    dao.close( _closed );
	    process.exit( 2 );
	}

	setTimeout( exercise_db, 1000 );

    } );
}

function exercise_db () {
    log( "starting exercise" );

    log( "exercising siteInfo" );

    dao.siteInfoRead( null, function( err, results ) {
	if( err ) {
	    log( "dao.siteInfoRead() error: " + err.toString() );
	    return dao.close( _closed );
	}

 	log( "dao.siteInfoRead() success" );

	assert.equal( results.title, 'kickstart' );
	assert.equal( results.subtitle, 'making node easier' );
	assert.equal( typeof results.copyright, 'string' );
	assert.equal( typeof results.tos, 'string' );

	date1 = results.updated;

	assert.equal( typeof date1, 'object' );

	setTimeout( modify_siteInfo, 2000 );
    } );
}

function modify_siteInfo() {
    dao.siteInfoUpdate( {title: 'i am the new title'}, function( err, results ) {
	if( err ) {
	    log( "dao.siteInfoUpdate() error: " + err.toString() );
	    return dao.close( _closed );
	}

	log( "dao.siteInfoUpdate() success" );

	read_siteInfo_again();
    } );
}

function read_siteInfo_again () {
    dao.siteInfoRead( null, function( err, results ) {
	if( err ) {
	    log( "dao.siteInfoRead() error: " + err.toString() );
	    return dao.close( _closed );
	}

	log( "dao.siteInfoRead() success" );

	assert.equal( results.title, 'i am the new title' );
	assert.equal( results.subtitle, 'making node easier' );
	assert.equal( typeof results.copyright, 'string' );
	assert.equal( typeof results.tos, 'string' );

	date2 = results.updated;

	assert.equal( typeof date2, 'object' );
	assert.notEqual( date1, date2 );

	lookup_by_email();
    } );
}

function lookup_by_email () {
    dao.emailIdentityReadByAddress( 'OhMeadhbh@gmail.com', function( err, results ) {
	if( err ) {
	    log( "dao.emailIdentityReadByAddress() error: " + err.toString() );
	    return dao.close( _closed );
	}

	log( "dao.emailIdentityReadByAddress() success" );

	console.log( results[0].user );

	get_user( results[0].user );
    } )
}

function get_user ( uuid ) {
    dao.userRead( uuid, function( err, results ) {
	if( err ) {
	    log( "dao.emailRead() error: " + err.toString() );
	    return dao.close( _closed );
	}

	log( "dao.emailRead() success" );

	console.log( results );
	
	dao.close( _closed );
    } );
}

function _closed () {
    log( "DB connection closed" );
}
