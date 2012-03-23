var webid;

$(document).ready( function ( ) {

	new home( [
		   'email_local', 'password_local', 'name_provision',
		   'email_provision', 'password_provision_1', 'password_provision_2'
		   ],
		  [
		   'login_local', 'recovery_local', 'twitter_social',
		   'facebook_social', 'signup_provision'
		   ]);

	webid = WebId.anonymous;
    } );

( function () {
    function WebId( name, uuid ) {
	this.name = name;
	this.uuid = uuid;
    }

    if( 'undefined' !== typeof window ) {
	window.WebId = WebId;
    }

    WebId.anonymous = new WebId( 'Anonymous', '00000000-0000-0000-0000-000000000000' );

} ) ();

( function () {
    var timer;

    function home ( inputs, buttons ) {
	for( var i = 0, il = inputs.length; i < il; i++ ) {
	    var item = inputs[i];
	    this[ item ] = $( '#' + item );
	}

	for( var i = 0, il = buttons.length; i < il; i++ ) {
	    var item = buttons[i];
	    $( '#' + item ).on( 'click', '', {that:this,item:item}, function ( e ) {
		    var f = e.data.that[ e.data.item ];
		    f && f.apply( e.data.that, [] );
		} );
	}
    }

    if( 'undefined' !== typeof window ) {
	window.home = home;
    }

    home.prototype.login_local = function () {
	$.ajax({
	    url: '/api/login.local',
	    async: true,
	    contentType: 'application/json',
	    data: JSON.stringify( {
	        email: this.email_local.val(),
	        passwd: this.password_local.val() } ),
	    dataType: 'json',
	    type: 'POST',
	    success: success,
	    error: error,
	    timeout: 10000,
	    headers: {'X-webid': webid.uuid }
	});

	function success (data, textStatus, jqXHR ) {
	    if( data && data.success ) {
		_cookie( 'webid', data.webid, data.expires );
		location.href = '/app';
	    } else {
		_raise_alert( 'error', _error( data ) );
	    }
	}

	function error ( jqXHR, textStatus, errorThrown ) {
	    _raise_alert( 'error', '(' + textStatus + ') ' + errorThrown );
	}
    };

    home.prototype.recovery_local = function () {
	_raise_alert( 'success', 'A password recovery link has been emailed to your account.' );
    };

    home.prototype.twitter_social = function () {
	location.href = "/api/login.twitter";
    };

    home.prototype.facebook_social = function () {
	console.log( 'home.prototype.facebook_social' );
    };

    home.prototype.signup_provision = function () {
	if( this.name_provision.val() && this.email_provision.val() &&
	    this.password_provision_1.val() && this.password_provision_2.val() ) {
	    if( this.password_provision_1.val() !== this.password_provision_2.val() ) {
		return _raise_alert( 'error', 'Both password fields must match.' );
	    }
	} else {
	    return _raise_alert( 'error', 'You must fill in all fields: Full Name, Email and both Password fields.' );
	}

	$.ajax({
	    url: '/api/provision.local',
            async: true,
	    contentType: 'application/json',
	    data: JSON.stringify( {
	        name: this.name_provision.val(),
	        email: this.email_provision.val(),
	        passwd: this.password_provision_1.val() } ),
	    dataType: 'json',
	    type: 'POST',
	    success: success,
	    error: error,
	    headers: {'X-webid': webid.uuid }
	});

	function success (data, textStatus, jqXHR ) {
	    if( data && data.success ) {
		reveal_signup_modal();
	    } else {
		_raise_alert( 'error', '(application error) ' + _error( data ) );
	    }
	}

	function error ( jqXHR, textStatus, errorThrown ) {
	    _raise_alert( 'error', '(' + textStatus + ') ' + errorThrown );
	}

	function reveal_signup_modal () {
	    $('#provision_modal').modal();
	}
    };

    function _raise_alert( type, message ) {
	var text = '<div class="fade in alert alert-' + type + '"><a class="close" data-dismiss="alert">&times;</a><strong>' + type.toUpperCase() + '!</strong> ' + message + '</div>';

	if( timer ) {
	    clearTimeout( timer );
	    $('.close').trigger('click');
	} 

	$('.front-alert-area').html( text );

	timer = setTimeout( function () {
	    $('.close').trigger('click');
	    timer = null;
	}, 7000 );
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

    function _cookie(name,value,expiration) {
	var cookie_string = encodeURIComponent(name) + '=' + encodeURIComponent(value) + "; path=/";

	if( expiration ) {
	    cookie_string += "; expires=" + (new Date(expiration)).toUTCString();
	}

	document.cookie=cookie_string;
    }

})();

