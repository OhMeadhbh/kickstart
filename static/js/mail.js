$(document).ready( function () {
	var id = $('#mailid').attr("data");
	var source;
	
	switch ( id ) {
	case 'signup':
	case 'recovery':
		source = id;
		break;
		
	default:
		source = 'id';
		break;
	}
	
	$('#content').html( $('#' + source).html() );
} );