var vitesse = require( './src/vitesse' );
var dao     = require( './src/dao_mockup' );

var server_options = {
    log: require( 'util' ).log,
    dao: new dao()
};

var server = vitesse.createServer( server_options );
server.init( addEndpoints );

function addEndpoints( properties, app ) {
    server.addStockEndpoints( properties, app );
    server.addStockApiEndpoints( properties, app );
    server.start();
}


