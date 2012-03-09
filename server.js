var vitesse = require( './src/vitesse' );

var server = vitesse.createServer( {log: require( 'util' ).log} );
server.init( addEndpoints );

function addEndpoints( properties, app ) {
    server.addStockEndpoints( properties, app )
    server.start();
}


