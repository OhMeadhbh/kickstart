// kickstart-http.js
//
// This is the skeletal app for the kickstart project. By default, we read the
// properties files specified in the command line, create a uuid generator and
// then add the stock endpoints.
//
// Remember to specify a properties file when you launch this app, like so:
//    node kickstart-http.js --config file://properties.json

var vitesse    = require( './src/vitesse' );
var props      = require( 'node-props' );
var mug        = require( 'node-mug' );
var dao_mysql  = require( './src/dao_mysql' );

var defaults;
var log;

start();

function init_server () {
    return vitesse.createServer( defaults ).init( function( server, express_app ) {
	server.addStockHTMLEndpoints( express_app );
	server.addStockApiEndpoints( express_app );
	    
	// This is a good place to add site specific setup code like adding
	// endpoints or initializing resources.
	    
	server.start();		
    } );
}

function init_dao() {
    var dao_options = defaults.persistence;
    dao_options.uuid = defaults.uuid;
	
    defaults.dao = new dao_mysql( dao_options );

    defaults.dao.init( function ( err ) {
	if( err ) {
	    log( 'error: ' + err.toString() );
	} else {
	    init_server();
	}
    } );
}

function init_mug () {
    return mug.createInstance( function( generator ) {
	defaults.uuid = generator;
	
	init_dao();
    } );
}

function start() {
    return props.read( function ( p ) {
	defaults = p;
	log = defaults.log = require( 'util' ).log;
	
	init_mug();
    } );
}
