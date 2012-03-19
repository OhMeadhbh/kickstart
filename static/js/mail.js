$(document).ready( function () {
	var mailid = $('#mailid').attr("data");
	var content = $('#content');

	console.log( 'mailid is: ' + mailid );

	if( mailid ) {
	    $.ajax({
		url: '/api/provision.complete',
		async: true,
		contentType: 'application/json',
	        data: JSON.stringify( { mailid: mailid } ),
	        dataType: 'json',
	        type: 'POST',
	        success: success,
		error: error,
		timeout: 10000
	   });
	} else {
	    _message( "<p>Well, this is embarassing. It seems we encountered an error that makes it difficult to retrieve the ID for this request.<br/>This is an unrecoverable error.</p>" );
	}

	function success (data, textStatus, jqXHR ) {
	    console.log( data );
	    if( data && data.success ) {
		_cookie( 'webid', data.webid );
		_message( '<p>Super! We were able to complete the registration process. <a href="/">Click here</a> to start using the app!</p>' );
	    } else {
		_message( '<p>Uh oh. We encountered this unrecoverable error:<br/>' + _error( data ) + '</p>' );
	    }
	}

	function error ( jqXHR, textStatus, errorThrown ) {
	    _message( 'error', '(' + textStatus + ') ' + errorThrown + '<br/>This is an unrecoverable error.' );
	}

	function _message ( msg ) {
	    content.html( msg );
	}

    function _error( data ) {
	var text = '';

	if( data && data.error ) {
	    text += data.error;
	}

	if( data && data.errno ) {
	    text += ' (' + data.errno + ')';
	}

	if( data && data.moreinfo ) {
	    text = '<a href="' + data.moreinfo + '">' + text + '</a>';
	}

	return( text );
    }

    function _cookie(name,value,persist) {
	var cookie_string = encodeURIComponent(name) + '=' + encodeURIComponent(value) + "; path=/; domain=kickstart.meadhbh.org";
	
	if( persist ) {
	    var now = Date.now();
	    cookie_string += "; expires=" + (new Date((Date.now() + 86400000))).toUTCString();
	}
	document.cookie=cookie_string;
    }

} );