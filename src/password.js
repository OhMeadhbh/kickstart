// password.js
//
// Vitesse uses node's crypto.pbkdf2() function to generate salted, iterative hashed
// "secrets." The way this is typically used in the real world is during registration,
// a user provides the system with a password / passphrase via a SSL/TLS connection.
// Rather than storing the password "in the clear," the system prepends randomly
// generated bytes (called the salt) and then hashes the "salted password." The
// PBKDF2 function (defined in both RFC 2898 and PKCS #5) actually repatedly hashes
// the salted password several times. The result of this process is then stored
// in the system's authentication database (along with the user's username, the
// randomly generated salt and the "iteration count" (the number of times it was
// hashed.)
//
// To verify the users' identity afterwards, the system asks for the user's username
// and password (again, over a SSL/TLS connection.) The system uses the username to
// lookup the randomly generated salt and iteration count. It uses these values to
// re-generate the "secret" it generated at registration-time. If the secret it
// generates is the same as the one stored in the authentication database, then we
// know that the user used the same password. If it differs, then the password was
// not the same.

(function () {
	var crypto = require( 'crypto' );
	
	// These values are set by PKCS#5 and RFC 2898
	var salt_length = 8;
	var key_length = 20;
	
	function password ( params ) {
		if( params ) {
			this.password = params.password;
			this.count = params.count;
			this.salt = params.salt;
			this.secret = params.secret;
		}
	}
	
	if( module && module.exports ) {
		module.exports = password;
	}
	
	password.prototype.generateSecret = function ( complete ) {
		var that = this;

		if( this.password && this.count ) {
			if( this.salt ) {
				return _generate_secret.apply( this, [ new Buffer( this.salt, 'base64'), complete ] );
			} else {
				crypto.randomBytes( salt_length, function( err, rb ) {
					if( err ) {
						return complete( err, null );
					} else {
						that.salt = rb.toString( 'base64' );
						return _generate_secret.apply( that, [ rb, complete ] );
					}
				} );
			}
		} else { 
			return complete( 'missing parameters( password or count )', null );
		}
	};
	
	password.prototype.validatePassword = function ( complete ) {
		var that = this;
		
		if( this.password && this.count && this.salt && this.secret ) {
			var trial = {
				password: this.password,
				count: this.count,
			};
			return _generate_secret.apply( trial, [ new Buffer( that.salt, 'base64' ), check ] );
		} else {
			return complete( 'missing parameters( password, count, salt or secret )', null );
		}
		
		function check ( err, data ) {
			if( err ) {
				complete( err, null );
			} else {
				complete( null, (that.secret === data.secret ) );
			}
		}
	};
	
	function _generate_secret( salt, complete ) {
		var that = this;
		
		crypto.pbkdf2( this.password, salt, this.count, key_length, function ( err, derivedKey ) {
			if( err ) {
				return complete( err, null );
			} else {
				var buffer = new Buffer( key_length );
				for( var i = 0; i < key_length; i++ ) {
					buffer[ i ] = derivedKey.charCodeAt( i );
				}
				that.secret = buffer.toString( 'base64' );
				return complete( null, that );
			}
		} );
	}
})();