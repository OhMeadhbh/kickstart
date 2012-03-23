$(document).ready ( function () {
	_get( '/template/app.xml', postTemplate, 'xml' );
	
	function postTemplate ( err, data ) {
	    $(data).find('template').each( function( i, e, j ) {
		    console.log( $(this).attr('id') );
		} );
	}
} )

function logout () {
    _cookie( 'webid', '', '1970-01-01T00:00:00Z');
    location.href = "/";
}

function _get( url, complete, dataType ) {
    that = this;
    $.ajax({
        url: url,
	async: true,
        contentType: 'application/json',
	dataType: ( dataType ? dataType : 'json' ),
	type: 'GET',
	success: success,
	error: error,
	timeout: 10000
    });
	
    function success(data, textStatus, jqXHR) {
	complete(null,data);
    }

    function error(jqXHR,textStatus,errorThrown) {
	var text = 'error retrieving  ' + url + '(' + textStatus + ')';
	if( errorThrown ) {
	    text += errorThrown.toString();
	}
	console.log( text );
	complete(text,null);
    }
}

function _cookie(name,value,expiration) {
    var cookie_string = encodeURIComponent(name) + '=' + encodeURIComponent(value) + "; path=/";

    if( expiration ) {
	cookie_string += "; expires=" + (new Date(expiration)).toUTCString();
    }

    document.cookie=cookie_string;
}
