var app;

$(document).ready( function () {
	app = (new App( {} )).init();
    } );

( function () {
    function App ( options ) {
	this.options = options;
    }

    if( 'undefined' !== typeof window ) {
	window.App = App;
    }

    App.prototype.init = function () {
	this.session = $('#session').attr( 'data' );
	this.getSeed( render_this );
	return this;
    };

    App.prototype.getSeed = function ( complete ) {
	this._get( '/api/seed/' + this.session, complete );
    };

    App.prototype._get = function ( url, complete ) {
	that = this;
	$.ajax({
	    url: url,
	    async: true,
	    contentType: 'application/json',
	    dataType: 'json',
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
    };

    function render_this ( err, data ) {
	data.userinfo && ( that.userinfo = data.userinfo );
	var dd = $("#dropdown");
	dd.html( data.userinfo.name + dd.html() );
    }

    App.prototype.logout = function () {
	document.cookie = "webid=";
	location.href = "/";
    };
} ) ();