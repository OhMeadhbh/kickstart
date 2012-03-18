var password = require( '../src/password' );
var assert   = require( 'assert' );

var test_fixtures = [
    {
    	password: 'whatever',
    	count: 2000
    },
    {
    	password: 'whatever',
    	count: 2000,
    	salt: 'CJEeuzOf608=',
    	secret: '56QwuH3D8qnCrw8FyVa3G3wyLBU=' 
    },
    {
    	password: 'dingo',
    	count: 2000,
    	salt: 'CJEeuzOf608=',
    	secret: '56QwuH3D8qnCrw8FyVa3G3wyLBU=' 
    },
    {
    	password: 'dingo'
    },
    {
    	count: 2000
    },
    {
    },
    {
    	password: 'enterprise',
    	salt: 'zpAtI1MlHUM=',
    	count: 1024,
    	secret: 'FudmjBs+B5a/2IlK2UKbGOM4YwU='
    },
    {
    	password: 'enterprise',
    	salt: 'zpAtI1MlHUM=',
    	count: 1024
    },
    {
    	password: 'enterprise',
    	count: 1024,
    	salt: 'zpAtI1MlHUM=',
    	secret: 'SGLe9dKeiHFujEyVPyUZEP2n+KM='
    }
];

var password_objects = [];

for( var i = 0, il = test_fixtures.length; i < il; i++ ) {
	password_objects.push( new password( test_fixtures[i] ) );
}

password_objects[0].generateSecret( function( err, data ) {
	assert( null === err, 'err is supposed to be null' );
	assert( 'object' === typeof data, 'data is supposed to be an object' );
	assert( 'string' === typeof data.password, 'password is supposed to be a string' );
	assert( 'number' === typeof data.count, 'count is supposed to be a number' );
	assert( 'string' === typeof data.salt, 'salt is supposed to be a string' );
	assert( 'string' === typeof data.secret, 'secret is supposed to be a string' );
} );

password_objects[1].validatePassword( function( err, data ) {
	assert( null === err, 'err is supposed to be null' );
	assert( data, 'validation data is supposed to be true' );
} );

password_objects[2].validatePassword( function( err, data ) {
	assert( null === err, 'err is supposed to be null' );
	assert( ! data, 'validation data is supposed to be false' );
} );

password_objects[3].generateSecret( function( err, data ) {
	assert( null === data, 'data is supposed to be null' );
	assert( err === 'missing parameters( password or count )', 'doh! we were supposed to throw an error here' );
} );

password_objects[4].generateSecret( function( err, data ) {
	assert( null === data, 'data is supposed to be null' );
	assert( err === 'missing parameters( password or count )', 'doh! we were supposed to throw an error here' );
} );

password_objects[5].generateSecret( function( err, data ) {
	assert( null === data, 'data is supposed to be null' );
	assert( err === 'missing parameters( password or count )', 'doh! we were supposed to throw an error here' );
} );

password_objects[6].validatePassword( function( err, data ) {
	console.log( err );
	console.log( data );
} );

password_objects[7].generateSecret( function( err, data ) {
	console.log( data );
} );

password_objects[8].validatePassword( function( err, data ) {
	console.log( err );
	console.log( data );
} );

