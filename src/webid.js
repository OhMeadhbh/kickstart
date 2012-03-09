(function () {
    module.exports = function ( uuid_generator ) {
	return function ( request, response, next ) {
	    if( request.headers[ 'x-webid' ] ) {
		request.webid = request.headers[ 'x-webid' ];
		next();
	    } else if( request.cookies[ 'webid' ] ) {
		request.webid = request.cookies[ 'webid' ];
		request.headers[ 'x-webid' ] = request.webid;
		next();
	    } else {
		uuid_generator.generate( function ( uuid ) {
			request.webid = uuid.toString();
			request.headers[ 'x-webid' ] = request.webid;
			response.cookie( 'webid', request.webid, {path: '/', maxAge: 86400} );
			next();
		    } );
	    }
	}
    }
})();