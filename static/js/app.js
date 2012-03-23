$(document).ready ( function () {

} )

function logout () {
    _cookie( 'webid', '', '1970-01-01T00:00:00Z');
    location.href = "/";
}

function _cookie(name,value,expiration) {
    var cookie_string = encodeURIComponent(name) + '=' + encodeURIComponent(value) + "; path=/";

    if( expiration ) {
	cookie_string += "; expires=" + (new Date(expiration)).toUTCString();
    }

    document.cookie=cookie_string;
}
