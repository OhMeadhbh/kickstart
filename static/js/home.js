var webid;

$(document).ready( function ( ) {
	new home( [
		   'email_local', 'password_local', 'name_provision',
		   'email_provision', 'password_provision'
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
		    cache: false,
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
	    console.log( data );
	    if( data && data.success ) {
		setCookie( 'webid', data.webid, 30 );
		location.href = '/app';
	    } else {
		_raise_alert( '(application error) ' + _error( data ) );
	    }
	}

	function error ( jqXHR, textStatus, errorThrown ) {
	    console.log( 'error' );
	    _raise_alert( '(' + textStatus + ') ' + errorThrown );
	}
    };

    home.prototype.recovery_local = function () {
	console.log( 'home.prototype.recovery_local' );
    };
    home.prototype.twitter_social = function () {
	console.log( 'home.prototype.twitter_social' );
    };
    home.prototype.facebook_social = function () {
	console.log( 'home.prototype.facebook_social' );
    };
    home.prototype.signup_provision = function () {
	console.log( 'home.prototype.signup_provision' );
    };

    //todo: add proper error handling w/ alerts and so forth
    function _raise_alert( message ) {
	console.log( message );
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

    function setCookie(c_name,value,exdays) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
    }
})();

