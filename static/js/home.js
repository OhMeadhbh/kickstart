$(document).ready( function ( ) {
	new home( [
		   'email_local', 'password_local', 'name_provision',
		   'email_provision', 'password_provision'
		   ],
		  [
		   'login_local', 'recovery_local', 'twitter_social',
		   'facebook_social', 'signup_provision'
		   ]);
    } );

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
	console.log( 'home.prototype.login_local' );
	console.log( this.email_local.val() );
	console.log( this.password_local.val() );

	$.ajax({
		url: '/api/login',
		    async: true,
		    complete: complete,
		    contentType: 'application/json',
		    data: JSON.stringify( {
		    email: this.email_local.val(),
				passwd: this.password_local.val() } ),
		    dataType: 'json',
		    type: 'POST',
		    url: '/api/binding.create'
		    });
	function complete( jqXHR, textStatus ) {
	    console.log( textStatus );
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
})();

