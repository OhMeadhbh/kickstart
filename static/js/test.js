var test;

$(document).ready( function () {
	test = (new Test( '#content' )).init();
} );

( function ( ) {
	var hide = {
			'login': {
				hide: ['name_local', 'password_local_2', 'register_local', 'forgot_local'],
				show: ['email_local', 'password_local_1', 'login_local', 'remember', 'forgot', 'register']
			},
			'forgot': {
				hide: ['name_local', 'password_local_1', 'password_local_2', 'login_local', 'remember', 'forgot', 'register_local'],
				show: ['email_local', 'register', 'forgot_local']
			},
			'register': {
				hide: ['remember', 'register', 'forgot', 'forgot_local', 'login_local'],
				show: ['name_local', 'email_local', 'password_local_1', 'password_local_2', 'register_local']
			},
	};
	function Test( selector ) {
		this.selector = selector;
		this.state = 'login';
	}
	
	if( 'undefined' !== typeof window ) {
		window.Test = Test;
	}
	
	Test.prototype.init = function () {
		var that = this;
		$( this.selector ).html( $( '#test' ).html() );
		$('.tabs').button();
		
		var buttons = [ 'login', 'forgot', 'register' ];
		for( var i = 0, il = buttons.length; i < il; i++ ) {
			$( '._' + buttons[i] ).on( 'click', '', buttons[i], function( e ) {
				that.state = e.data;
				that.render();
			} );
			$( '#' + buttons[i] + '_local' ).on( 'click', that[ buttons[i] ] );
		}
		
		this.render();
	};
	
	Test.prototype.render = function() {
		$('._' + this.state ).button('toggle');
		var l = hide[ this.state ].hide;
		for( var i = 0, il = l.length; i < il; i++ ) {
			$( '#' + l[i] ).addClass( 'x-hidden' );
		}
		var l = hide[ this.state ].show;
		for( var i = 0, il = l.length; i < il; i++ ) {
			$( '#' + l[i] ).removeClass( 'x-hidden' );
		}
	};
	
	Test.prototype.login = function () {
		console.log( 'login' );
	};

	Test.prototype.forgot = function () {
		console.log( 'forgot' );
	};

	Test.prototype.register = function () {
		console.log( 'register' );
	};
} ) ( );

